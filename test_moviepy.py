import sys
import os

print("Python executable:", sys.executable)
print("Current directory:", os.getcwd())
print("Python path:", sys.path)

try:
    from moviepy.editor import VideoFileClip
    print("MoviePy imported successfully")
except Exception as e:
    print("Error importing MoviePy:", str(e))
    print("MoviePy package location:", os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) 