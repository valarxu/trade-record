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
    const profitClass = parseFloat(record.profit) >= 0 ? 'profit-positive' : 'profit-negative';
    
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${record.symbol}</td>
      <td>${record.direction}</td>
      <td>${record.openPrice}</td>
      <td>${record.closePrice}</td>
      <td>${record.amount}</td>
      <td class="${profitClass}">${record.profit}</td>
      <td>
        ${record.imagePath ? `<img src="file://${record.imagePath}" class="thumbnail" width="50" height="50">` : ''}
      </td>
      <td>${record.notes || ''}</td>
      <td>
        <button class="action-btn edit" data-id="${record.id}">编辑</button>
        <button class="action-btn delete" data-id="${record.id}">删除</button>
      </td>
    `;
    
    recordsBody.appendChild(row);
  });
  
  // 添加编辑和删除按钮的事件监听器
  document.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteConfirmation(btn.dataset.id));
  });
}

// 打开添加记录模态框
function openAddModal() {
  modalTitle.textContent = '添加交易记录';
  recordForm.reset();
  currentRecordId = null;
  
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
    document.getElementById('closePrice').value = record.closePrice;
    document.getElementById('amount').value = record.amount;
    document.getElementById('profit').value = record.profit;
    document.getElementById('notes').value = record.notes || '';
    
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
function handleImagePreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.alt = '预览图片';
    imagePreview.innerHTML = '';
    imagePreview.appendChild(img);
    imagePreview.style.display = 'block';
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
      handleImagePreview(file);
      imageInput.files = new DataTransfer().files;
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

// 保存记录（添加或更新）
async function saveRecord(event) {
  event.preventDefault();
  
  try {
    // 收集表单数据
    const recordData = {
      date: document.getElementById('date').value,
      symbol: document.getElementById('symbol').value,
      direction: document.getElementById('direction').value,
      openPrice: parseFloat(document.getElementById('openPrice').value),
      closePrice: parseFloat(document.getElementById('closePrice').value),
      amount: parseFloat(document.getElementById('amount').value),
      profit: parseFloat(document.getElementById('profit').value),
      notes: document.getElementById('notes').value
    };
    
    // 如果有图片数据，添加到记录中
    if (currentImageData) {
      recordData.imageData = currentImageData;
    }
    
    // 如果是编辑模式，添加ID
    if (currentRecordId) {
      recordData.id = currentRecordId;
      await window.electronAPI.updateRecord(recordData);
    } else {
      // 添加新记录
      await window.electronAPI.addRecord(recordData);
    }
    
    // 关闭模态框并重新加载记录
    recordModal.style.display = 'none';
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
});

// 自动计算盈亏金额（可选功能）
const openPriceInput = document.getElementById('openPrice');
const closePriceInput = document.getElementById('closePrice');
const amountInput = document.getElementById('amount');
const profitInput = document.getElementById('profit');
const directionSelect = document.getElementById('direction');

// 当价格或数量变化时计算盈亏
function calculateProfit() {
  const openPrice = parseFloat(openPriceInput.value) || 0;
  const closePrice = parseFloat(closePriceInput.value) || 0;
  const amount = parseFloat(amountInput.value) || 0;
  const direction = directionSelect.value;
  
  if (openPrice && closePrice && amount && direction) {
    let profit = 0;
    
    if (direction === '多') {
      // 多头：(平仓价 - 开仓价)/开仓价 * 开仓金额
      profit = ((closePrice - openPrice) / openPrice) * amount;
    } else if (direction === '空') {
      // 空头：(开仓价 - 平仓价)/开仓价 * 开仓金额
      profit = ((openPrice - closePrice) / openPrice) * amount;
    }
    
    // 四舍五入到两位小数
    profitInput.value = Math.round(profit * 100) / 100;
  }
}

// 添加事件监听器
openPriceInput.addEventListener('input', calculateProfit);
closePriceInput.addEventListener('input', calculateProfit);
amountInput.addEventListener('input', calculateProfit);
directionSelect.addEventListener('change', calculateProfit);

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