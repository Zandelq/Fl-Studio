from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

# Serve the homepage
@app.route('/')
def home():
    return render_template('index.html')

# Serve sounds
@app.route('/sounds/<path:filename>')
def sounds(filename):
    return send_from_directory('sounds', filename)

if __name__ == "__main__":
    app.run(debug=True)