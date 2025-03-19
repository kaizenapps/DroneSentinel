import os
import logging
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO
import numpy as np
import torch
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure upload folders
UPLOAD_FOLDER = 'uploads'
MODEL_FOLDER = os.path.join(UPLOAD_FOLDER, 'models')
AUDIO_FOLDER = os.path.join(UPLOAD_FOLDER, 'audio')
ALLOWED_MODEL_EXTENSIONS = {'tflite', 'onnx', 'pt', 'pth'}
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg'}

# Create upload directories if they don't exist
os.makedirs(MODEL_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
socketio = SocketIO(app)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/upload_model', methods=['POST'])
def upload_model():
    try:
        if 'model' not in request.files:
            return jsonify({"status": "error", "message": "No model file provided"}), 400

        file = request.files['model']
        model_type = request.form.get('type', '')

        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        if file and allowed_file(file.filename, ALLOWED_MODEL_EXTENSIONS):
            filename = secure_filename(file.filename)
            file_path = os.path.join(MODEL_FOLDER, filename)
            file.save(file_path)

            logger.info(f"Model uploaded successfully: {filename}")
            return jsonify({
                "status": "success",
                "message": "Model uploaded successfully",
                "filename": filename,
                "type": model_type
            })

        return jsonify({"status": "error", "message": "Invalid file type"}), 400
    except Exception as e:
        logger.error(f"Error uploading model: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/delete_model/<filename>', methods=['DELETE'])
def delete_model(filename):
    try:
        file_path = os.path.join(MODEL_FOLDER, secure_filename(filename))
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Model deleted successfully: {filename}")
            return jsonify({"status": "success", "message": "Model deleted successfully"})
        return jsonify({"status": "error", "message": "Model not found"}), 404
    except Exception as e:
        logger.error(f"Error deleting model: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/test_model', methods=['POST'])
def test_model():
    try:
        if 'audio' not in request.files or 'model' not in request.form:
            return jsonify({"status": "error", "message": "Missing audio file or model selection"}), 400

        audio_file = request.files['audio']
        model_name = request.form['model']

        if audio_file.filename == '' or not allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({"status": "error", "message": "Invalid audio file"}), 400

        # Save audio file temporarily
        audio_filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(AUDIO_FOLDER, audio_filename)
        audio_file.save(audio_path)

        # Load model and perform test
        model_path = os.path.join(MODEL_FOLDER, secure_filename(model_name))

        # Placeholder for model testing logic
        test_results = {
            "model_name": model_name,
            "audio_file": audio_filename,
            "detection_confidence": 0.85,
            "processing_time_ms": 150,
            "detected_frequencies": [2000, 4000, 6000],
            "status": "success"
        }

        return jsonify({
            "status": "success",
            "results": test_results
        })

    except Exception as e:
        logger.error(f"Error testing model: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    try:
        models = []
        for filename in os.listdir(MODEL_FOLDER):
            if allowed_file(filename, ALLOWED_MODEL_EXTENSIONS):
                file_ext = filename.rsplit('.', 1)[1].lower()
                model_type = {
                    'onnx': 'ONNX Model',
                    'pt': 'PyTorch Model',
                    'pth': 'PyTorch Model',
                    'tflite': 'TensorFlow Lite Model'
                }.get(file_ext, 'Unknown')

                models.append({
                    "name": filename,
                    "type": model_type
                })

        return jsonify({"status": "success", "models": models})
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({"status": "error", "message": "No audio file provided"}), 400

        file = request.files['audio']
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        if file and allowed_file(file.filename, ALLOWED_AUDIO_EXTENSIONS):
            filename = secure_filename(file.filename)
            file.save(os.path.join(AUDIO_FOLDER, filename))
            logger.info(f"Audio file uploaded successfully: {filename}")
            return jsonify({"status": "success", "message": "Audio file uploaded successfully"})

        return jsonify({"status": "error", "message": "Invalid file type"}), 400
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/audio_files', methods=['GET'])
def list_audio_files():
    try:
        audio_files = [f for f in os.listdir(AUDIO_FOLDER) if allowed_file(f, ALLOWED_AUDIO_EXTENSIONS)]
        return jsonify({"status": "success", "audio_files": audio_files})
    except Exception as e:
        logger.error(f"Error listing audio files: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/start_detection', methods=['POST'])
def start_detection():
    try:
        return jsonify({"status": "success", "message": "Detection started"})
    except Exception as e:
        logger.error(f"Error starting detection: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/stop_detection', methods=['POST'])
def stop_detection():
    try:
        return jsonify({"status": "success", "message": "Detection stopped"})
    except Exception as e:
        logger.error(f"Error stopping detection: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/switch_model/<model_type>', methods=['POST'])
def switch_model(model_type):
    try:
        if model_type not in ['fpv', 'shahed']:
            raise ValueError("Invalid model type")
        logger.info(f"Switching to {model_type} model")
        return jsonify({"status": "success", "message": f"Switched to {model_type} model"})
    except Exception as e:
        logger.error(f"Error switching model: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@socketio.on('audio_data')
def handle_audio_data(data):
    try:
        # Process audio data using numpy for frequency analysis
        audio_np = np.frombuffer(data, dtype=np.float32)

        # Simple frequency analysis (placeholder)
        detection_result = {
            "detected": False,
            "confidence": 0.0,
            "model_type": "fpv",
            "status": "active"
        }

        socketio.emit('detection_result', detection_result)
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        socketio.emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)