import express from 'express';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import cors from 'cors';
import { Request, Response } from 'express';

const app = express();
const port = 3000;

// 启用 CORS
app.use(cors());

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

// 确保上传目录存在
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const convertPdfToText = async (pdfPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'converters', 'pdf_converter.py');
    const process = spawn('python', [pythonScript, pdfPath]);

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
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
const handleFileUpload = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const filePath = file.path;
    console.log('Processing file:', filePath);

    const result = await convertPdfToText(filePath);
    
    // 删除上传的文件
    fs.unlinkSync(filePath);

    res.json({ text: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '转换过程中发生错误' });
  }
};

app.post('/convert', upload.single('file'), handleFileUpload);

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 