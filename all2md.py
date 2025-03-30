#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
from converters.pdf_converter import convert_pdf_to_markdown, convert_pdf_to_text

def main():
    parser = argparse.ArgumentParser(description='Convert various file formats to Markdown')
    parser.add_argument('input_file', help='Input file path')
    parser.add_argument('--format', choices=['markdown', 'text'], default='markdown',
                      help='Output format (default: markdown)')
    parser.add_argument('--output', '-o', help='Output file path')
    
    args = parser.parse_args()
    
    # 获取文件扩展名
    _, ext = os.path.splitext(args.input_file)
    ext = ext.lower()
    
    # 设置默认输出文件名
    if not args.output:
        base_name = os.path.splitext(args.input_file)[0]
        args.output = f"{base_name}.{'md' if args.format == 'markdown' else 'txt'}"
    
    # 根据文件类型选择转换器
    if ext == '.pdf':
        if args.format == 'markdown':
            convert_pdf_to_markdown(args.input_file, args.output)
        else:
            convert_pdf_to_text(args.input_file, args.output)
    else:
        print(f"Unsupported file format: {ext}")
        print("Currently supported formats:")
        print("- PDF (.pdf)")

if __name__ == '__main__':
    main() 