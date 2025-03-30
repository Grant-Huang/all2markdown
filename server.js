const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());

// 添加 CSP 头
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; media-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// 提供静态文件服务
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 确保必要的目录存在
['uploads', 'public'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// 处理文件上传和转换
app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }

  const format = req.body.format || 'text';
  const pythonScript = format === 'markdown' ? 'pdf_to_md.py' : 'converters/pdf_converter.py';
  const pythonProcess = spawn('python', [pythonScript, req.file.path, format]);

  let output = '';
  let error = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    error += data.toString();
  });

  pythonProcess.on('close', (code) => {
    // 删除上传的文件
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('删除文件失败:', err);
      }
    });

    if (code !== 0) {
      return res.status(500).json({ error: '转换失败', details: error });
    }

    res.json({ result: output });
  });
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 