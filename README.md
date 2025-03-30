# All2Markdown

一个将各种格式文件转换为Markdown格式的工具。目前支持PDF文件的转换，未来将支持更多格式。

本项目基于 [markdownify-mcp](http://github.com/zcaceres/markdownify-mcp) 项目开发。

## 功能特点

- 支持PDF文件转换为Markdown格式
- 支持PDF文件转换为纯文本格式
- 保持文档的格式和结构
- 支持中文文本提取
- 自动识别标题层级
- 保持段落顺序

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/Grant-Huang/all2markdown.git
cd all2markdown
```

2. 创建虚拟环境（推荐）：
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate  # Windows
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 安装Tesseract-OCR（如果需要OCR功能）：
- Windows: 从[这里](https://github.com/UB-Mannheim/tesseract/wiki)下载安装
- Linux: `sudo apt-get install tesseract-ocr`
- Mac: `brew install tesseract`

## 使用方法

基本用法：
```bash
python all2md.py <输入文件路径> [--format {markdown,text}] [--output 输出文件路径]
```

参数说明：
- `输入文件路径`：要转换的文件路径
- `--format`：输出格式，可选 `markdown`（默认）或 `text`
- `--output`或`-o`：输出文件路径（可选，默认为输入文件同目录下的同名文件）

示例：
```bash
# 转换为Markdown格式（默认）
python all2md.py document.pdf

# 转换为纯文本格式
python all2md.py document.pdf --format text

# 指定输出文件
python all2md.py document.pdf -o output.md
```

## 支持的格式

目前支持的输入格式：
- PDF文件 (.pdf)

计划支持的格式：
- Word文档 (.docx)
- Excel表格 (.xlsx)
- PowerPoint演示文稿 (.pptx)
- 图片文件 (.jpg, .png, etc.)
- 网页 (.html)

## 贡献

欢迎提交Pull Request来改进代码或添加新功能。

## 致谢

本项目基于 [markdownify-mcp](http://github.com/zcaceres/markdownify-mcp) 项目开发，感谢原作者的开源贡献。

## 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件。
