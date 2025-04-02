import os
import sys
import argparse
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
import requests
from youtube_transcript_api import YouTubeTranscriptApi

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from converters.pdf_converter import convert_pdf_to_text

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tools/pdf-to-markdown', methods=['POST'])
def convert():
    try:
        if not request.is_json:
            return jsonify({'error': '请求必须是 JSON 格式'}), 400
        
        data = request.get_json()
        if not data or 'filepath' not in data:
            return jsonify({'error': '缺少 filepath 参数'}), 400
        
        filepath = data['filepath']
        format_type = data.get('format', 'markdown')
        
        # 构建完整的文件路径
        full_path = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(filepath)))
        print(f'Converting file: {full_path}')
        
        if not os.path.exists(full_path):
            return jsonify({'error': f'文件不存在: {full_path}'}), 404
        
        # 转换文件
        text = convert_pdf_to_text(full_path)
        
        # 如果是纯文本格式，移除所有 Markdown 标记
        if format_type == 'text':
            text = text.replace('#', '').replace('*', '').replace('`', '')
        
        return jsonify({
            'text': text
        })
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': '只支持PDF文件'}), 400
    
    # 保存上传的文件
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    # 返回文件名
    return jsonify({'filepath': filename})

@app.route('/api/tools/youtube-to-markdown', methods=['POST'])
def convert_youtube():
    try:
        if not request.is_json:
            return jsonify({'error': '请求必须是 JSON 格式'}), 400
        
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': '缺少 url 参数'}), 400
        
        url = data['url']
        
        # 从URL中提取视频ID
        if 'youtube.com' in url:
            video_id = url.split('v=')[1].split('&')[0]
        elif 'youtu.be' in url:
            video_id = url.split('/')[-1]
        else:
            return jsonify({'error': '无效的YouTube URL'}), 400
        
        # 获取视频标题
        try:
            response = requests.get(f'https://www.youtube.com/oembed?url={url}&format=json')
            video_info = response.json()
            title = video_info['title']
        except:
            title = "YouTube Video"
        
        # 获取视频字幕
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['zh', 'en'])
        except Exception as e:
            return jsonify({'error': f'无法获取视频字幕: {str(e)}'}), 400
        
        # 构建Markdown内容
        markdown = f"# {title}\n\n"
        markdown += "## 视频字幕\n\n"
        
        for entry in transcript:
            start_time = int(entry['start'])
            minutes = start_time // 60
            seconds = start_time % 60
            timestamp = f"{minutes:02d}:{seconds:02d}"
            markdown += f"**{timestamp}** {entry['text']}\n\n"
        
        return jsonify({
            'text': markdown
        })
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PDF to Markdown Web Server')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=3000, help='Port to bind to')
    args = parser.parse_args()
    
    app.run(host=args.host, port=args.port, debug=True) 