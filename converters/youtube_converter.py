import sys
import requests
from youtube_transcript_api import YouTubeTranscriptApi

def get_video_title(video_id):
    try:
        response = requests.get(f'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json')
        video_info = response.json()
        return video_info['title']
    except:
        return "YouTube Video"

def convert_youtube_to_markdown(video_id):
    try:
        # 获取视频标题
        title = get_video_title(video_id)
        
        # 获取视频字幕
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['zh', 'en'])
        
        # 构建Markdown内容
        markdown = f"# {title}\n\n"
        markdown += "## 视频字幕\n\n"
        
        for entry in transcript:
            start_time = int(entry['start'])
            minutes = start_time // 60
            seconds = start_time % 60
            timestamp = f"{minutes:02d}:{seconds:02d}"
            markdown += f"**{timestamp}** {entry['text']}\n\n"
        
        return markdown
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python youtube_converter.py <video_id>", file=sys.stderr)
        sys.exit(1)
    
    video_id = sys.argv[1]
    markdown = convert_youtube_to_markdown(video_id)
    print(markdown) 