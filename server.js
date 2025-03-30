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
    cb(null, 'uploads/');
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

const convertPdfToText = async (pdfPath, format = 'markdown') => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'converters', 'pdf_converter.py');
    const process = spawn('python', [pythonScript, pdfPath, format]);

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      const text = data.toString('utf8');
      output += text;
      console.log('Python stdout:', text);  // 打印 stdout 输出
    });

    process.stderr.on('data', (data) => {
      const text = data.toString('utf8');
      error += text;
      console.log('Python stderr:', text);  // 打印 stderr 输出
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${error}`));
        return;
      }
      resolve(output);
    });
  });
};

// 处理文件上传和转换
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const filePath = req.file.path;
    const format = req.body.format || 'markdown';
    console.log('Processing file:', filePath, 'format:', format);

    const result = await convertPdfToText(filePath, format);
    
    // 删除上传的文件
    fs.unlinkSync(filePath);

    res.json({ text: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '转换过程中发生错误' });
  }
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 