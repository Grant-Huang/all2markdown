import sys
import os
import warnings
import fitz  # PyMuPDF
import re

def convert_pdf_to_text(pdf_path, output_format='markdown'):
    try:
        # 忽略警告
        warnings.filterwarnings('ignore')
        
        # 检查文件是否存在
        if not os.path.exists(pdf_path):
            print(f"Error: File not found: {pdf_path}", file=sys.stderr)
            sys.exit(1)

        # 检查文件大小
        file_size = os.path.getsize(pdf_path)
        if file_size == 0:
            print(f"Error: File is empty: {pdf_path}", file=sys.stderr)
            sys.exit(1)

        print(f"Processing PDF file: {pdf_path}", file=sys.stderr)
        print(f"File size: {file_size} bytes", file=sys.stderr)

        # 打开PDF文件
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        print(f"Number of pages: {num_pages}", file=sys.stderr)
        
        # 存储所有页面的文本块
        all_blocks = []
        
        # 遍历每一页并提取文本
        for page_num in range(num_pages):
            try:
                # 获取当前页面
                page = doc[page_num]
                
                # 提取文本块，包含位置信息
                blocks = page.get_text("dict")["blocks"]
                
                for block in blocks:
                    if "lines" in block:
                        # 获取块的位置信息
                        bbox = block.get("bbox", [0, 0, 0, 0])
                        # 计算块的垂直位置（用于排序）
                        y_pos = (bbox[1] + bbox[3]) / 2
                        
                        block_text = []
                        for line in block["lines"]:
                            line_text = []
                            for span in line["spans"]:
                                text = span["text"]
                                # 处理字体大小和样式
                                font_size = span["size"]
                                font_name = span["font"].lower()
                                
                                # 根据字体大小判断标题级别
                                if font_size >= 16:
                                    text = f"# {text}"
                                elif font_size >= 14:
                                    text = f"## {text}"
                                elif font_size >= 12:
                                    text = f"### {text}"
                                
                                # 处理字体样式
                                if "bold" in font_name:
                                    text = f"**{text}**"
                                if "italic" in font_name:
                                    text = f"*{text}*"
                                
                                line_text.append(text)
                            
                            if line_text:
                                block_text.append(" ".join(line_text))
                        
                        if block_text:
                            # 将块添加到列表中，包含位置信息
                            all_blocks.append({
                                'text': "\n".join(block_text),
                                'y_pos': y_pos,
                                'page': page_num
                            })
                
                print(f"Successfully processed page {page_num + 1}", file=sys.stderr)
                    
            except Exception as page_error:
                print(f"Error processing page {page_num + 1}: {str(page_error)}", file=sys.stderr)
                continue
        
        # 关闭PDF文件
        doc.close()
        
        if not all_blocks:
            print("Error: No text content was extracted from the PDF", file=sys.stderr)
            sys.exit(1)
        
        # 按页面和垂直位置排序文本块
        all_blocks.sort(key=lambda x: (x['page'], x['y_pos']))
        
        # 合并所有文本块
        text_content = []
        current_page = -1
        
        for block in all_blocks:
            # 如果页面改变，添加分页符
            if block['page'] != current_page:
                if current_page != -1:
                    text_content.append("\n---\n")  # 添加分页符
                current_page = block['page']
            
            text_content.append(block['text'])
        
        # 将所有文本合并
        final_content = '\n\n'.join(text_content)
        
        # 如果是纯文本格式，移除所有Markdown标记
        if output_format == 'text':
            final_content = re.sub(r'[#*`]', '', final_content)
        
        # 设置标准输出的编码为UTF-8
        if sys.stdout.encoding != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8')
        
        # 打印结果到标准输出
        print(final_content, file=sys.stdout)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(f"Error type: {type(e).__name__}", file=sys.stderr)
        import traceback
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_md.py <pdf_file_path> [format]", file=sys.stderr)
        print("format: 'markdown' (default) or 'text'", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'markdown'
    
    if output_format not in ['markdown', 'text']:
        print("Error: format must be either 'markdown' or 'text'", file=sys.stderr)
        sys.exit(1)
    
    convert_pdf_to_text(pdf_path, output_format) 