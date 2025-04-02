# 交易记录管理系统

一个基于Electron的桌面应用，用于管理和记录交易活动。该应用允许用户添加、编辑、完成和删除交易记录，支持图片上传功能，帮助交易者更好地记录和复盘交易活动。

## 功能特点

- 创建和管理交易记录
- 记录交易品种、方向、价格、止损止盈等信息
- 自动计算预期盈亏比
- 上传交易K线图截图
- 交易完成后记录实际结果
- 支持交易复盘记录
- 数据本地存储，确保隐私安全

## 文件结构及说明

### 主要文件

- **main.js**: Electron主进程文件，负责创建窗口、设置IPC通信以及管理数据存储
- **preload.js**: 预加载脚本，负责在渲染进程中安全地暴露主进程API
- **renderer.js**: 渲染进程脚本，包含所有前端UI交互逻辑和数据处理
- **index.html**: 应用的主HTML页面，定义了应用的整体结构和界面元素
- **styles.css**: 应用的样式表，定义了应用的外观和布局
- **package.json**: 项目配置文件，包含项目依赖和脚本命令

### 目录

- **images/**: 存储用户上传的交易截图
- **node_modules/**: npm依赖包目录

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **HTML/CSS/JavaScript**: 前端技术
- **electron-store**: 本地数据持久化存储

## 功能实现细节

### 数据存储

应用使用electron-store进行本地数据持久化存储，交易记录以JSON格式保存在本地文件中。

### 主进程与渲染进程通信

通过IPC (进程间通信) 实现主进程与渲染进程的数据交换：

- `get-records`: 获取所有交易记录
- `add-record`: 添加新交易记录
- `update-record`: 更新现有交易记录
- `delete-record`: 删除交易记录

### 图片处理

交易K线图截图上传后会保存在本地images目录，并通过唯一ID与交易记录关联。

## 如何运行

```bash
# 安装依赖
npm install

# 运行应用
npm start
```

## 应用打包

本项目使用electron-builder进行打包，可以生成Windows可执行程序：

```bash
# 安装开发依赖
npm install --save-dev electron-builder

# 为Windows平台打包
npm run build
```

打包后的文件将生成在`dist`目录下，包括：
- 安装程序(.exe)：用户可以安装到系统中
- 便携版(.exe)：无需安装，直接运行的版本

### 打包配置

打包配置在`package.json`的`build`字段中定义，主要配置项包括：
- `appId`: 应用唯一标识
- `productName`: 产品名称
- `win.target`: 打包目标类型（安装版和便携版）
- `nsis`: 安装程序配置

## 开发者注意事项

- 主进程中已实现了良好的安全实践，如启用contextIsolation和关闭nodeIntegration
- 使用preload.js暴露安全的API接口，避免在渲染进程中直接访问Node.js API
- 图片文件存储在本地images目录，并使用交易记录ID作为文件名 