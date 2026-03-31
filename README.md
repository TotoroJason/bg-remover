# 🎨 智能去背景工具

基于 Next.js + TypeScript + Remove.bg API 的快速去背景工具

## 🚀 功能特性

- 📁 拖拽上传图片
- 🖼️ Canvas 实时显示原图 vs 去背景对比
- 📥 下载 PNG 透明背景格式
- ⚡ Next.js API Routes 后端
- 🧠 内存存储（无需数据库）

## 🛠️ 快速开始

### 1. 获取 API Key

访问 [remove.bg](https://www.remove.bg/api) 注册并获取免费 API Key

### 2. 配置环境变量

复制 `.env.local` 并填入你的 API Key：

```bash
REMOVE_BG_API_KEY=your_actual_api_key_here
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用！

## 📦 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **上传组件**: react-dropzone
- **图片预览**: Canvas API
- **去背景**: Remove.bg API
- **HTTP 客户端**: Axios

## 🎯 使用说明

1. 拖拽图片到上传区域，或点击选择图片
2. 等待处理完成
3. 查看原图和去背景后的对比效果
4. 点击"下载 PNG"保存透明背景图片

## 📝 注意事项

- 免费版 API 有调用次数限制
- 图片存储在内存中，重启服务器会丢失
- 支持格式: JPG, PNG, GIF
