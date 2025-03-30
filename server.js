const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3000;

// 启用CORS
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

// 确保必要的目录存在
['uploads', 'public'].forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`创建目录: ${dir}`);
        fs.mkdirSync(dir);
    } else {
        console.log(`目录已存在: ${dir}`);
    }
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        console.log(`检查上传目录: ${uploadDir}`);
        if (!fs.existsSync(uploadDir)) {
            console.log(`创建上传目录: ${uploadDir}`);
            fs.mkdirSync(uploadDir);
        }
        console.log(`上传目录状态: ${fs.existsSync(uploadDir) ? '存在' : '不存在'}`);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path.extname(file.originalname);
        console.log(`生成文件名: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
    },
    fileFilter: function (req, file, cb) {
        // 检查文件类型
        if (!file.mimetype.includes('pdf')) {
            console.error('不支持的文件类型:', file.mimetype);
            return cb(new Error('只支持PDF文件'));
        }
        cb(null, true);
    }
});

// 处理文件上传和转换
app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) {
        console.error('没有上传文件');
        return res.status(400).json({ error: '没有上传文件' });
    }

    const filePath = req.file.path;
    const format = req.body.format || 'text';

    console.log('文件上传信息:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
    });

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error('文件不存在:', filePath);
        return res.status(400).json({ error: '文件不存在' });
    }

    // 检查文件大小
    const stats = fs.statSync(filePath);
    console.log('文件状态:', {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
    });

    if (stats.size === 0) {
        console.error('文件为空:', filePath);
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: '文件为空' });
    }

    console.log('开始处理文件:', filePath);
    console.log('输出格式:', format);

    // 调用Python脚本进行转换
    const pythonProcess = spawn('python', ['converters/pdf_converter.py', filePath, format]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        console.log('Python输出:', data.toString());
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error('Python错误:', data.toString());
        errorOutput += data.toString();
    });

    pythonProcess.on('error', (err) => {
        console.error('Python进程错误:', err);
        errorOutput += err.toString();
    });

    pythonProcess.on('close', (code) => {
        console.log('Python进程退出，代码:', code);
        
        // 删除上传的文件
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('删除文件失败:', err);
            } else {
                console.log('文件已删除:', filePath);
            }
        });

        if (code === 0 && output) {
            res.json({ content: output });
        } else {
            res.status(500).json({ 
                error: '转换失败',
                details: errorOutput || '未知错误'
            });
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
        }
    }
    res.status(500).json({ error: err.message || '服务器内部错误' });
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
}); 