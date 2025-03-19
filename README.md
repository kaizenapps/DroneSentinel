# 🎯 Project Uriel - Drone Audio Detection System

> Developed by [KaizenApps.com](https://KaizenApps.com) for [KaizenLabs.uk](https://KaizenLabs.uk)

## 🌟 Overview

Project Uriel is a cutting-edge web-based drone detection system that uses audio processing and machine learning to identify and classify drone sounds in real-time. The system specializes in detecting FPV drones and Shahed-type drones through their unique acoustic signatures.

## 🎥 Demo

![Demo](demo.gif)

## 🔧 Technology Stack

```mermaid
graph TD
    A[Web Interface] --> B[Flask Backend]
    B --> C[Audio Processing]
    B --> D[Model Management]
    C --> E[PyTorch Models]
    C --> F[ONNX Models]
    D --> G[Model Testing]
    D --> H[Audio Analysis]
```

- 🌐 Frontend:
  - Tailwind CSS for styling
  - Material UI Icons
  - WebSocket for real-time updates
  - Web Audio API for audio capture

- 🔙 Backend:
  - Flask + Flask-SocketIO
  - PyTorch for model inference
  - NumPy & SciPy for audio processing
  - SQLAlchemy for data management

## 🚀 Features

- 🎤 Real-time audio capture and processing
- 🤖 Multiple model support (ONNX, PyTorch)
- 📊 Live confidence scoring
- ⏱️ Uptime tracking
- 📝 System logging
- ⚙️ Admin interface for model management
- 🧪 Model testing capabilities

## 📱 Compatible Devices

The system works on any device with:
- A modern web browser
- Microphone access
- Internet connection

Tested platforms:
- 💻 Desktop (Chrome, Firefox, Safari)
- 📱 Mobile devices
- 🎯 Edge devices with microphone capabilities

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/kaizenlabs/project-uriel.git

# Install dependencies
pip install -r requirements.txt

# Start the application
python main.py
```

## 📊 Architecture

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant WebAudio
    participant Server
    participant ML Model

    User->>Browser: Start Detection
    Browser->>WebAudio: Initialize Audio Capture
    loop Every 1024 samples
        WebAudio->>Server: Send Audio Data
        Server->>ML Model: Process Audio
        ML Model->>Server: Detection Results
        Server->>Browser: Update UI
    end
```

## 🎯 Use Cases

1. **Drone Detection**
```mermaid
graph LR
    A[Audio Input] --> B[Feature Extraction]
    B --> C[Model Inference]
    C --> D{Detection}
    D -->|Yes| E[Alert System]
    D -->|No| F[Continue Monitoring]
```

2. **Model Management**
```mermaid
graph TD
    A[Upload Model] --> B{Validate Format}
    B -->|Valid| C[Store Model]
    B -->|Invalid| D[Error Message]
    C --> E[Test Model]
    E --> F[Deploy Model]
```

## 🌟 Major Inspirations

This project builds upon and improves the work from:
- [Acoustic Activity Recognition in JavaScript](https://dev.to/devdevcharlie/acoustic-activity-recognition-in-javascript-2go4)
- [Armaaruss Drone Detection](https://github.com/Armaaruss/Armaaruss.github.io)
- [CMU's Ubicoustics Project](http://www.gierad.com/assets/ubicoustics/ubicoustics.pdf)

Key improvements:
- Enhanced real-time processing
- Multiple model support
- Advanced admin interface
- Improved audio analysis algorithms
- Better user interface and feedback

## 📚 References

1. [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
2. [PyTorch Audio Processing](https://pytorch.org/audio/stable/index.html)
3. [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
4. [Tailwind CSS](https://tailwindcss.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Contact

For support or queries:
- 📧 Email: support@kaizenlabs.uk
- 🌐 Website: https://kaizenlabs.uk
- 💬 Twitter: [@KaizenLabsUK](https://twitter.com/KaizenLabsUK)

---

<p align="center">Made with ❤️ by KaizenApps.com</p>
