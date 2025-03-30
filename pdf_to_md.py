import sys
import fitz  # PyMuPDF

def convert_pdf_to_markdown(pdf_path):
    try:
        # 打开PDF文件
        doc = fitz.open(pdf_path)
        
        # 存储所有页面的文本
        markdown_text = []
        
        # 遍历每一页
        for page_num in range(len(doc)):
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
                        markdown_text.append("\n".join(block_text))
        
        # 关闭PDF文件
        doc.close()
        
        # 返回转换后的Markdown文本
        return "\n\n".join(markdown_text)
        
    except Exception as e:
        print(f"Error converting PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pdf_to_md.py <pdf_file>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    markdown_text = convert_pdf_to_markdown(pdf_path)
    print(markdown_text) 