from flask import Flask, render_template, request, send_file, jsonify
import os
import argparse
from werkzeug.utils import secure_filename
from converters.pdf_converter import convert_pdf_to_markdown, convert_pdf_to_text

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': '只支持PDF文件'}), 400
    
    format_type = request.form.get('format', 'markdown')
    
    # 保存上传的文件
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        # 转换文件
        output_filename = os.path.splitext(filename)[0] + ('.md' if format_type == 'markdown' else '.txt')
        output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
        
        if format_type == 'markdown':
            convert_pdf_to_markdown(filepath, output_filepath)
        else:
            convert_pdf_to_text(filepath, output_filepath)
        
        # 读取转换后的文件
        with open(output_filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 清理临时文件
        os.remove(filepath)
        os.remove(output_filepath)
        
        return jsonify({
            'success': True,
            'content': content,
            'format': format_type
        })
        
    except Exception as e:
        # 清理临时文件
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

def build_static_site():
    """生成静态站点"""
    with app.test_client() as client:
        # 获取主页内容
        response = client.get('/')
        html = response.data.decode('utf-8')
        
        # 保存到静态目录
        os.makedirs('static', exist_ok=True)
        with open('static/index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        # 复制静态文件
        import shutil
        shutil.copytree('static', '../static', dirs_exist_ok=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='All2Markdown Web Server')
    parser.add_argument('--build-static', action='store_true', help='Build static site')
    args = parser.parse_args()
    
    if args.build_static:
        build_static_site()
    else:
        app.run(debug=True) 