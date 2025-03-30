import sys
import os
import pdfplumber
import io

# 中文处理方式说明：
# 1. 设置标准输出和标准错误的编码为utf-8，解决控制台输出中文乱码问题
# 2. 使用 pdfplumber 的 extract_text() 方法提取文本，该方法会自动处理中文编码
# 3. 确保输出文本为 utf-8 编码，避免编码转换问题
# 4. 使用 errors='ignore' 参数处理无法解码的字符，确保程序不会崩溃
# 5. 最终输出时使用 encode('utf-8').decode('utf-8') 确保文本格式正确

# 设置标准输出和标准错误的编码为utf-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def convert_pdf_to_text(pdf_path, output_format='text'):
    try:
        # 检查文件是否存在
        if not os.path.exists(pdf_path):
            print(f"错误：文件 {pdf_path} 不存在", file=sys.stderr)
            return None

        # 检查文件大小
        if os.path.getsize(pdf_path) == 0:
            print(f"错误：文件 {pdf_path} 为空", file=sys.stderr)
            return None

        print("\n=== 使用pdfplumber提取文本 ===", file=sys.stderr)
        
        # 打开PDF文件
        with pdfplumber.open(pdf_path) as pdf:
            # 存储所有页面的文本
            all_text = []
            
            # 遍历所有页面
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n正在处理第 {page_num} 页...", file=sys.stderr)
                
                # 提取文本
                text = page.extract_text()
                
                if text:
                    # 确保文本是utf-8编码
                    if not isinstance(text, str):
                        text = text.decode('utf-8', errors='ignore')
                    
                    # 打印调试信息
                    print(f"第 {page_num} 页提取的文本:", file=sys.stderr)
                    print(text[:200], file=sys.stderr)
                    
                    # 添加页码信息
                    if output_format == 'markdown':
                        page_content = f"\n## 第 {page_num} 页\n\n{text}"
                    else:
                        page_content = f"\n--- 第 {page_num} 页 ---\n{text}"
                    
                    all_text.append(page_content)
            
            # 合并所有页面的文本
            if all_text:
                final_text = "\n\n".join(all_text)
                return final_text.strip()
            return None

    except Exception as e:
        print(f"转换过程中出错: {str(e)}", file=sys.stderr)
        import traceback
        print(f"错误详情: {traceback.format_exc()}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_md.py <pdf_file_path> [format]", file=sys.stderr)
        print("format: 'markdown' (default) or 'text'", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else 'text'
    
    if output_format not in ['markdown', 'text']:
        print("Error: format must be either 'markdown' or 'text'", file=sys.stderr)
        sys.exit(1)
    
    result = convert_pdf_to_text(pdf_path, output_format)
    if result:
        # 使用utf-8编码输出结果，确保中文正确显示
        if isinstance(result, str):
            print(result.encode('utf-8').decode('utf-8'))
        else:
            print(result.decode('utf-8'))
    else:
        sys.exit(1) 