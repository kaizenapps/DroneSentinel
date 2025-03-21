document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    let isListening = false;
    let startTime = null;
    let audioContext = null;
    let mediaStream = null;
    let analyser = null;
    let canvasCtx = null;
    let levelCtx = null;
    let animationFrame = null;

    // UI Elements
    const listenBtn = document.getElementById('listenBtn');
    const modelSelect = document.getElementById('modelSelect');
    const statusText = document.getElementById('statusText');
    const uptimeText = document.getElementById('uptimeText');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const alertBox = document.getElementById('alertBox');
    const logContent = document.getElementById('logContent');
    const spectrogramCanvas = document.getElementById('spectrogram');
    const levelCanvas = document.getElementById('levelMeter');

    function addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `py-1 ${type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`;
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    // Initialize visualizations
    function initVisualizations() {
        // Initialize level meter
        levelCtx = levelCanvas.getContext('2d');
        levelCanvas.width = levelCanvas.offsetWidth;
        levelCanvas.height = levelCanvas.offsetHeight;

        // Initialize spectrogram
        canvasCtx = spectrogramCanvas.getContext('2d');
        spectrogramCanvas.width = spectrogramCanvas.offsetWidth;
        spectrogramCanvas.height = spectrogramCanvas.offsetHeight;

        // Configure analyser
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            if (!isListening) return;
            animationFrame = requestAnimationFrame(draw);

            // Update level meter
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const amplitude = (dataArray[i] - 128) / 128;
                sum += amplitude * amplitude;
            }
            const rms = Math.sqrt(sum / bufferLength);
            const level = Math.min(1, rms * 5); // Amplify the level for better visibility

            levelCtx.fillStyle = 'rgb(0, 0, 0)';
            levelCtx.fillRect(0, 0, levelCanvas.width, levelCanvas.height);
            levelCtx.fillStyle = `hsl(${120 - level * 120}, 100%, 50%)`; // Green to red
            levelCtx.fillRect(0, 0, levelCanvas.width * level, levelCanvas.height);

            // Update spectrogram
            analyser.getByteFrequencyData(dataArray);
            const imageData = canvasCtx.getImageData(1, 0, spectrogramCanvas.width - 1, spectrogramCanvas.height);
            canvasCtx.putImageData(imageData, 0, 0);

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                const y = Math.floor((i / bufferLength) * spectrogramCanvas.height);
                const intensity = value / 255;
                const hue = (1 - intensity) * 240;
                canvasCtx.fillStyle = `hsl(${hue}, 100%, ${intensity * 50}%)`;
                canvasCtx.fillRect(spectrogramCanvas.width - 1, spectrogramCanvas.height - y, 1, 1);
            }
        }

        // Clear canvases
        levelCtx.fillStyle = 'rgb(0, 0, 0)';
        levelCtx.fillRect(0, 0, levelCanvas.width, levelCanvas.height);
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);

        draw();
        addLog('Audio visualizations initialized');
    }

    async function startListening() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            addLog('Microphone access granted');

            const source = audioContext.createMediaStreamSource(mediaStream);
            analyser = audioContext.createAnalyser();
            const processor = audioContext.createScriptProcessor(1024, 1, 1);

            source.connect(analyser);
            analyser.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = function(e) {
                const audioData = e.inputBuffer.getChannelData(0);
                socket.emit('audio_data', audioData.buffer);
            };

            startTime = Date.now();
            updateUptime();
            initVisualizations();

            // Update UI
            isListening = true;
            listenBtn.innerHTML = '<span class="material-icons mr-2">stop</span>Stop Listening';
            listenBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            listenBtn.classList.add('bg-red-600', 'hover:bg-red-700');
            statusText.textContent = 'Active';
            statusText.classList.add('text-green-400');
            modelSelect.disabled = true;
            addLog('Started listening for drone audio');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            addLog('Error accessing microphone: ' + error.message, 'error');
            if (error.name === 'NotAllowedError') {
                addLog('Please ensure microphone permissions are granted in your browser settings', 'warning');
            }
        }
    }

    function stopListening() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        // Clear canvases
        if (levelCtx && canvasCtx) {
            levelCtx.clearRect(0, 0, levelCanvas.width, levelCanvas.height);
            levelCtx.fillStyle = 'rgb(0, 0, 0)';
            levelCtx.fillRect(0, 0, levelCanvas.width, levelCanvas.height);

            canvasCtx.clearRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
        }

        // Update UI
        isListening = false;
        listenBtn.innerHTML = '<span class="material-icons mr-2">mic</span>Start Listening';
        listenBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        listenBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        statusText.textContent = 'Idle';
        statusText.classList.remove('text-green-400');
        modelSelect.disabled = false;
        startTime = null;
        uptimeText.textContent = '00:00:00';
        addLog('Stopped listening');
    }

    function updateUptime() {
        if (startTime) {
            const diff = Date.now() - startTime;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            uptimeText.textContent =
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setTimeout(updateUptime, 1000);
        }
    }

    // Event Listeners
    listenBtn.addEventListener('click', function() {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    });

    modelSelect.addEventListener('change', function() {
        if (!isListening) {
            fetch(`/switch_model/${this.value}`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    addLog(`Switched to ${this.options[this.selectedIndex].text} model`);
                } else {
                    addLog('Error switching model: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addLog('Error switching model: ' + error.message, 'error');
            });
        }
    });

    // Socket Events
    socket.on('detection_result', function(data) {
        const confidence = Math.round(data.confidence * 100);
        confidenceBar.style.width = `${confidence}%`;
        confidenceText.textContent = `${confidence}%`;

        if (data.detected) {
            alertBox.classList.remove('hidden');
            alertBox.classList.add('alert-animation');
            new Audio('/static/alert.mp3').play().catch(e => console.log('Audio play failed:', e));
            addLog(`🚨 Detection Alert: ${data.model_type} drone detected with ${confidence}% confidence`);
        } else {
            alertBox.classList.add('hidden');
            alertBox.classList.remove('alert-animation');
        }
    });

    socket.on('error', function(data) {
        console.error('Socket error:', data.message);
        addLog('Socket error: ' + data.message, 'error');
    });

    // Initial log
    addLog('System initialized');
    addLog('Note: For best audio visualization support, Firefox is recommended. Chrome users may experience limited functionality.', 'warning');
});