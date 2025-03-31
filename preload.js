// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取所有交易记录
  getRecords: () => ipcRenderer.invoke('get-records'),
  
  // 添加新交易记录
  addRecord: (record) => ipcRenderer.invoke('add-record', record),
  
  // 更新交易记录
  updateRecord: (record) => ipcRenderer.invoke('update-record', record),
  
  // 删除交易记录
  deleteRecord: (id) => ipcRenderer.invoke('delete-record', id)
});