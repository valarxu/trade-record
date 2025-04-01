const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 初始化存储
const store = new Store({
  name: 'trade-records',
  defaults: {
    records: []
  }
});

// 创建图片存储目录
const fs = require('fs');
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的 index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 打开开发者工具（可选，开发时使用）
  // mainWindow.webContents.openDevTools();

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，除非用户使用Cmd + Q明确退出
  // 否则应用及其菜单栏通常会保持活动状态
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口
  if (mainWindow === null) createWindow();
});

// 处理IPC通信

// 获取所有交易记录
ipcMain.handle('get-records', () => {
  return store.get('records');
});

// 添加新交易记录
ipcMain.handle('add-record', async (event, record) => {
  const records = store.get('records');
  // 生成唯一ID
  record.id = Date.now().toString();
  // 添加时间戳
  record.createdAt = new Date().toISOString();
  
  // 处理图片上传
  if (record.imageData) {
    const imagePath = path.join(imagesDir, `${record.id}.png`);
    await fs.promises.writeFile(imagePath, record.imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    record.imagePath = imagePath;
    delete record.imageData;
  }
  
  records.push(record);
  store.set('records', records);
  return record;
});

// 更新交易记录
ipcMain.handle('update-record', async (event, updatedRecord) => {
  const records = store.get('records');
  const index = records.findIndex(record => record.id === updatedRecord.id);
  if (index !== -1) {
    // 处理图片上传
    if (updatedRecord.imageData) {
      const imagePath = path.join(imagesDir, `${updatedRecord.id}.png`);
      await fs.promises.writeFile(imagePath, updatedRecord.imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      updatedRecord.imagePath = imagePath;
      delete updatedRecord.imageData;
    }
    
    records[index] = { ...records[index], ...updatedRecord, updatedAt: new Date().toISOString() };
    store.set('records', records);
    return records[index];
  }
  return null;
});

// 删除交易记录
ipcMain.handle('delete-record', async (event, id) => {
  const records = store.get('records');
  const recordToDelete = records.find(record => record.id === id);
  
  // 如果找到记录并且有图片，删除图片文件
  if (recordToDelete && recordToDelete.imagePath) {
    try {
      await fs.promises.unlink(recordToDelete.imagePath);
    } catch (error) {
      console.error('删除图片文件失败:', error);
      // 继续执行记录的删除，即使图片删除失败
    }
  }
  
  const newRecords = records.filter(record => record.id !== id);
  store.set('records', newRecords);
  return id;
});