from flask import Flask, render_template, request, send_from_directory
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file and file.filename.lower().endswith(('.mp3', '.mov')):
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        return {'success': True, 'filename': file.filename}
    return {'success': False, 'error': 'Invalid file type'}

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
