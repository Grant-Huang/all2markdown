# PDF to Markdown Converter

这是一个基于 [markdownify-mcp](http://github.com/zcaceres/markdownify-mcp) 项目的PDF转Markdown工具。

## 功能特点

- 支持PDF文件转换为Markdown格式
- 支持PDF文件转换为纯文本格式
- 保持文档的格式和结构
- 支持中文文本提取
- 自动识别标题层级
- 保持段落顺序

## 安装依赖

```bash
pip install PyMuPDF
```

## 使用方法

```bash
python pdf_to_md.py <pdf文件路径> [格式]
```

格式参数可选：
- `markdown` (默认): 输出Markdown格式
- `text`: 输出纯文本格式

## 示例

```bash
python pdf_to_md.py input.pdf markdown
python pdf_to_md.py input.pdf text
```

## 致谢

本项目基于 [markdownify-mcp](http://github.com/zcaceres/markdownify-mcp) 项目开发，感谢原作者的开源贡献。
