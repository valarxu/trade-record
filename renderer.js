// 使用preload.js中暴露的API
// 不再需要直接require electron

// DOM元素
const recordsTable = document.getElementById('recordsTable');
const recordsBody = document.getElementById('recordsBody');
const noRecordsDiv = document.getElementById('noRecords');
const addRecordBtn = document.getElementById('addRecordBtn');
const recordModal = document.getElementById('recordModal');
const modalTitle = document.getElementById('modalTitle');
const recordForm = document.getElementById('recordForm');
const closeModalBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const confirmModal = document.getElementById('confirmModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const completeTradeModal = document.getElementById('completeTradeModal');
const completeTradeForm = document.getElementById('completeTradeForm');
const cancelCompleteBtn = document.getElementById('cancelCompleteBtn');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const imageModal = document.getElementById('imageModal');
const previewImage = document.getElementById('previewImage');
const imageModalClose = document.querySelector('.image-modal-close');

// 当前选中的记录ID（用于编辑和删除操作）
let currentRecordId = null;
let currentImageData = null;

// 初始化：加载所有记录
loadRecords();

// 加载所有交易记录
async function loadRecords() {
  try {
    const records = await window.electronAPI.getRecords();
    renderRecords(records);
  } catch (error) {
    console.error('加载记录失败:', error);
    alert('加载记录失败，请重试');
  }
}

// 计算预期盈亏比
function calculateRiskRewardRatio() {
  const openPrice = parseFloat(document.getElementById('openPrice').value) || 0;
  const stopLossPrice = parseFloat(document.getElementById('stopLossPrice').value) || 0;
  const takeProfitPrice = parseFloat(document.getElementById('takeProfitPrice').value) || 0;
  const direction = document.getElementById('direction').value;
  
  if (openPrice && stopLossPrice && takeProfitPrice && direction) {
    let risk, reward;
    if (direction === '多') {
      risk = openPrice - stopLossPrice;
      reward = takeProfitPrice - openPrice;
    } else {
      risk = stopLossPrice - openPrice;
      reward = openPrice - takeProfitPrice;
    }
    
    if (risk > 0) {
      const ratio = (reward / risk).toFixed(2);
      document.getElementById('riskRewardRatio').value = `${ratio}:1`;
    }
  }
}

// 渲染交易记录到表格
function renderRecords(records) {
  // 清空表格内容
  recordsBody.innerHTML = '';
  
  if (records.length === 0) {
    // 如果没有记录，显示提示信息
    recordsTable.style.display = 'none';
    noRecordsDiv.style.display = 'block';
    return;
  }
  
  // 有记录时，显示表格，隐藏提示
  recordsTable.style.display = 'table';
  noRecordsDiv.style.display = 'none';
  
  // 按日期降序排序（最新的记录在前面）
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 添加记录到表格
  records.forEach(record => {
    const row = document.createElement('tr');
    
    // 格式化日期
    const date = new Date(record.date);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // 设置盈亏的CSS类
    const profitClass = record.actualProfit >= 0 ? 'profit-positive' : 'profit-negative';
    const statusClass = record.status === '持仓中' ? 'status-open' : 'status-closed';
    
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${record.symbol}</td>
      <td>${record.direction}</td>
      <td>${record.openPrice}</td>
      <td>${record.stopLossPrice}</td>
      <td>${record.takeProfitPrice}</td>
      <td>${record.riskRewardRatio}</td>
      <td>${record.amount}</td>
      <td class="${statusClass}">${record.status}</td>
      <td>${record.actualClosePrice || '-'}</td>
      <td class="${profitClass}">${record.actualProfit || '-'}</td>
      <td>
        ${record.imagePath ? `<img src="file://${record.imagePath}" class="thumbnail" width="50" height="50">` : ''}
      </td>
      <td>
        ${record.status === '持仓中' ? 
          `<button class="complete-trade-btn" data-id="${record.id}">完成交易</button>` : ''}
        <button class="delete-btn" data-id="${record.id}">删除</button>
      </td>
    `;
    
    recordsBody.appendChild(row);
  });
  
  // 添加完成交易按钮的事件监听
  document.querySelectorAll('.complete-trade-btn').forEach(btn => {
    btn.addEventListener('click', () => openCompleteTradeModal(btn.dataset.id));
  });
  
  // 添加删除按钮的事件监听器
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteConfirmation(btn.dataset.id));
  });
}

// 打开添加记录模态框
function openAddModal() {
  modalTitle.textContent = '新建交易';
  recordForm.reset();
  currentRecordId = null;
  currentImageData = null;
  imagePreview.innerHTML = '';
  imagePreview.style.display = 'none';
  
  // 重置图片输入的required属性
  imageInput.setAttribute('required', '');
  
  // 设置默认日期为今天
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  document.getElementById('date').value = formattedDate;
  
  recordModal.style.display = 'block';
}

// 打开编辑记录模态框
async function openEditModal(id) {
  try {
    modalTitle.textContent = '编辑交易记录';
    currentRecordId = id;
    
    // 获取所有记录
    const records = await window.electronAPI.getRecords();
    const record = records.find(r => r.id === id);
    
    if (!record) {
      alert('找不到该记录');
      return;
    }
    
    // 填充表单
    document.getElementById('recordId').value = record.id;
    document.getElementById('date').value = record.date;
    document.getElementById('symbol').value = record.symbol;
    document.getElementById('direction').value = record.direction;
    document.getElementById('openPrice').value = record.openPrice;
    document.getElementById('stopLossPrice').value = record.stopLossPrice;
    document.getElementById('takeProfitPrice').value = record.takeProfitPrice;
    document.getElementById('riskRewardRatio').value = record.riskRewardRatio;
    document.getElementById('amount').value = record.amount;
    document.getElementById('openReason').value = record.openReason || '';
    
    // 显示已有图片
    if (record.imagePath) {
      const img = document.createElement('img');
      img.src = `file://${record.imagePath}`;
      img.alt = '交易图片';
      imagePreview.innerHTML = '';
      imagePreview.appendChild(img);
      imagePreview.style.display = 'block';
      currentImageData = record.imagePath;
    } else {
      imagePreview.style.display = 'none';
      currentImageData = null;
    }
    
    recordModal.style.display = 'block';
  } catch (error) {
    console.error('加载记录详情失败:', error);
    alert('加载记录详情失败，请重试');
  }
}

// 打开删除确认模态框
function openDeleteConfirmation(id) {
  currentRecordId = id;
  confirmModal.style.display = 'block';
}

// 处理图片预览
function handleImagePreview(file, previewElement = imagePreview) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = '预览图片';
    previewElement.innerHTML = '';
    previewElement.appendChild(img);
    previewElement.style.display = 'block';
    currentImageData = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 处理图片粘贴
function handleImagePaste(event) {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      // 判断当前激活的模态框
      if (completeTradeModal.style.display === 'block') {
        handleImagePreview(file, completeImagePreview);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        completeImageInput.files = dataTransfer.files;
      } else if (recordModal.style.display === 'block') {
        handleImagePreview(file, imagePreview);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
        imageInput.removeAttribute('required');
      }
      break;
    }
  }
}

// 打开图片预览模态框
function openImagePreview(src) {
  previewImage.src = src;
  imageModal.style.display = 'block';
}

// 关闭图片预览模态框
function closeImagePreview() {
  imageModal.style.display = 'none';
}

// 打开完成交易模态框
async function openCompleteTradeModal(id) {
  try {
    currentRecordId = id;
    const records = await window.electronAPI.getRecords();
    const record = records.find(r => r.id === id);
    
    if (!record) {
      alert('找不到该记录');
      return;
    }
    
    // 填充表单
    document.getElementById('completeTradeId').value = record.id;
    document.getElementById('completeDate').value = record.date;
    document.getElementById('completeSymbol').value = record.symbol;
    document.getElementById('completeDirection').value = record.direction;
    document.getElementById('completeOpenPrice').value = record.openPrice;
    document.getElementById('completeStopLossPrice').value = record.stopLossPrice;
    document.getElementById('completeTakeProfitPrice').value = record.takeProfitPrice;
    document.getElementById('completeRiskRewardRatio').value = record.riskRewardRatio;
    document.getElementById('completeAmount').value = record.amount;
    document.getElementById('completeOpenReason').value = record.openReason || '';
    
    // 显示已有图片
    if (record.imagePath) {
      const img = document.createElement('img');
      img.src = `file://${record.imagePath}`;
      img.alt = '交易图片';
      const completeImagePreview = document.getElementById('completeImagePreview');
      completeImagePreview.innerHTML = '';
      completeImagePreview.appendChild(img);
      completeImagePreview.style.display = 'block';
      currentImageData = record.imagePath;
    }
    
    completeTradeModal.style.display = 'block';
  } catch (error) {
    console.error('加载记录详情失败:', error);
    alert('加载记录详情失败，请重试');
  }
}

// 完成交易
async function completeTrade(event) {
  event.preventDefault();
  
  try {
    const records = await window.electronAPI.getRecords();
    const record = records.find(r => r.id === currentRecordId);
    
    if (!record) {
      alert('找不到该记录');
      return;
    }
    
    // 收集所有表单数据
    const actualClosePrice = parseFloat(document.getElementById('actualClosePrice').value);
    const reviewNotes = document.getElementById('reviewNotes').value;
    
    // 计算实际盈亏
    let actualProfit;
    const openPrice = parseFloat(document.getElementById('completeOpenPrice').value);
    const amount = parseFloat(document.getElementById('completeAmount').value);
    const direction = document.getElementById('completeDirection').value;
    
    if (direction === '多') {
      actualProfit = ((actualClosePrice - openPrice) / openPrice) * amount;
    } else {
      actualProfit = ((openPrice - actualClosePrice) / openPrice) * amount;
    }
    
    // 更新记录
    const updatedRecord = {
      ...record,
      date: document.getElementById('completeDate').value,
      symbol: document.getElementById('completeSymbol').value,
      direction: document.getElementById('completeDirection').value,
      openPrice: parseFloat(document.getElementById('completeOpenPrice').value),
      stopLossPrice: parseFloat(document.getElementById('completeStopLossPrice').value),
      takeProfitPrice: parseFloat(document.getElementById('completeTakeProfitPrice').value),
      riskRewardRatio: document.getElementById('completeRiskRewardRatio').value,
      amount: parseFloat(document.getElementById('completeAmount').value),
      openReason: document.getElementById('completeOpenReason').value,
      status: '已平仓',
      actualClosePrice,
      actualProfit: Math.round(actualProfit * 100) / 100,
      reviewNotes,
      closedAt: new Date().toISOString()
    };
    
    // 如果有新的图片数据
    const completeImage = document.getElementById('completeImage');
    if (completeImage.files.length > 0) {
      const file = completeImage.files[0];
      const reader = new FileReader();
      const imageDataPromise = new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      updatedRecord.imageData = await imageDataPromise;
    } else if (currentImageData && currentImageData !== record.imagePath) {
      updatedRecord.imageData = currentImageData;
    }
    
    await window.electronAPI.updateRecord(updatedRecord);
    
    // 关闭模态框并重新加载记录
    completeTradeModal.style.display = 'none';
    completeTradeForm.reset();
    loadRecords();
  } catch (error) {
    console.error('完成交易失败:', error);
    alert('完成交易失败，请重试');
  }
}

// 保存记录
async function saveRecord(event) {
  event.preventDefault();
  
  try {
    // 检查是否有图片（通过文件输入或粘贴）
    if (!currentImageData && !imageInput.files.length) {
      alert('请上传或粘贴K线截图');
      return;
    }

    const recordData = {
      date: document.getElementById('date').value,
      symbol: document.getElementById('symbol').value,
      direction: document.getElementById('direction').value,
      openPrice: parseFloat(document.getElementById('openPrice').value),
      stopLossPrice: parseFloat(document.getElementById('stopLossPrice').value),
      takeProfitPrice: parseFloat(document.getElementById('takeProfitPrice').value),
      riskRewardRatio: document.getElementById('riskRewardRatio').value,
      amount: parseFloat(document.getElementById('amount').value),
      openReason: document.getElementById('openReason').value,
      status: '持仓中'
    };
    
    if (currentImageData) {
      recordData.imageData = currentImageData;
    }
    
    if (currentRecordId) {
      recordData.id = currentRecordId;
      await window.electronAPI.updateRecord(recordData);
    } else {
      await window.electronAPI.addRecord(recordData);
    }
    
    recordModal.style.display = 'none';
    recordForm.reset();
    // 重置图片输入的required属性
    imageInput.setAttribute('required', '');
    loadRecords();
  } catch (error) {
    console.error('保存记录失败:', error);
    alert('保存记录失败，请重试');
  }
}

// 删除记录
async function deleteRecord() {
  try {
    if (!currentRecordId) return;
    
    await window.electronAPI.deleteRecord(currentRecordId);
    confirmModal.style.display = 'none';
    loadRecords();
  } catch (error) {
    console.error('删除记录失败:', error);
    alert('删除记录失败，请重试');
  }
}

// 事件监听器

// 添加记录按钮
addRecordBtn.addEventListener('click', openAddModal);

// 表单提交
recordForm.addEventListener('submit', saveRecord);
completeTradeForm.addEventListener('submit', completeTrade);

// 关闭模态框
closeModalBtn.addEventListener('click', () => {
  recordModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
  recordModal.style.display = 'none';
});

// 删除确认
cancelDeleteBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
});

confirmDeleteBtn.addEventListener('click', deleteRecord);

// 点击模态框外部关闭
window.addEventListener('click', (event) => {
  if (event.target === recordModal) {
    recordModal.style.display = 'none';
  }
  if (event.target === confirmModal) {
    confirmModal.style.display = 'none';
  }
  if (event.target === completeTradeModal) {
    completeTradeModal.style.display = 'none';
    completeTradeForm.reset();
  }
});

// 自动计算盈亏金额（可选功能）
const openPriceInput = document.getElementById('openPrice');
const stopLossPriceInput = document.getElementById('stopLossPrice');
const takeProfitPriceInput = document.getElementById('takeProfitPrice');
const directionSelect = document.getElementById('direction');

// 添加事件监听器
openPriceInput.addEventListener('input', calculateRiskRewardRatio);
stopLossPriceInput.addEventListener('input', calculateRiskRewardRatio);
takeProfitPriceInput.addEventListener('input', calculateRiskRewardRatio);
directionSelect.addEventListener('change', calculateRiskRewardRatio);

// 图片相关事件监听
imageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImagePreview(e.target.files[0]);
  }
});

imagePreview.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG') {
    openImagePreview(e.target.src);
  }
});

imageModalClose.addEventListener('click', closeImagePreview);

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    closeImagePreview();
  }
});

// 添加粘贴事件监听
document.addEventListener('paste', handleImagePaste);

// 取消完成交易
cancelCompleteBtn.addEventListener('click', () => {
  completeTradeModal.style.display = 'none';
  completeTradeForm.reset();
});

// 关闭完成交易模态框
completeTradeModal.querySelector('.close').addEventListener('click', () => {
  completeTradeModal.style.display = 'none';
  completeTradeForm.reset();
});

// 完成交易表单的预期盈亏比计算
function calculateCompleteRiskRewardRatio() {
  const openPrice = parseFloat(document.getElementById('completeOpenPrice').value) || 0;
  const stopLossPrice = parseFloat(document.getElementById('completeStopLossPrice').value) || 0;
  const takeProfitPrice = parseFloat(document.getElementById('completeTakeProfitPrice').value) || 0;
  const direction = document.getElementById('completeDirection').value;
  
  if (openPrice && stopLossPrice && takeProfitPrice && direction) {
    let risk, reward;
    if (direction === '多') {
      risk = openPrice - stopLossPrice;
      reward = takeProfitPrice - openPrice;
    } else {
      risk = stopLossPrice - openPrice;
      reward = openPrice - takeProfitPrice;
    }
    
    if (risk > 0) {
      const ratio = (reward / risk).toFixed(2);
      document.getElementById('completeRiskRewardRatio').value = `${ratio}:1`;
    }
  }
}

// 添加完成交易表单的图片处理事件监听
const completeImageInput = document.getElementById('completeImage');
const completeImagePreview = document.getElementById('completeImagePreview');

completeImageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImagePreview(e.target.files[0], completeImagePreview);
  }
});

completeImagePreview.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG') {
    openImagePreview(e.target.src);
  }
});