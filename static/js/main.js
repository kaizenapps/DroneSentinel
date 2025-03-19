document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    let isListening = false;
    let startTime = null;
    let audioContext = null;
    let mediaStream = null;

    const listenBtn = document.getElementById('listenBtn');
    const modelSelect = document.getElementById('modelSelect');
    const statusText = document.getElementById('statusText');
    const uptimeText = document.getElementById('uptimeText');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');
    const currentModelText = document.getElementById('currentModelText');
    const alertBox = document.getElementById('alertBox');

    async function startListening() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const source = audioContext.createMediaStreamSource(mediaStream);
            const processor = audioContext.createScriptProcessor(1024, 1, 1);
            
            source.connect(processor);
            processor.connect(audioContext.destination);
            
            processor.onaudioprocess = function(e) {
                const audioData = e.inputBuffer.getChannelData(0);
                socket.emit('audio_data', audioData.buffer);
            };

            startTime = Date.now();
            updateUptime();
            
            // Update UI
            isListening = true;
            listenBtn.textContent = 'Stop Listening';
            listenBtn.classList.remove('btn-primary');
            listenBtn.classList.add('btn-danger');
            statusText.textContent = 'Active';
            statusText.classList.add('text-green-400');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please ensure microphone permissions are granted.');
        }
    }

    function stopListening() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
            audioContext.close();
        }
        
        // Update UI
        isListening = false;
        listenBtn.textContent = 'Start Listening';
        listenBtn.classList.remove('btn-danger');
        listenBtn.classList.add('btn-primary');
        statusText.textContent = 'Idle';
        statusText.classList.remove('text-green-400');
        startTime = null;
        uptimeText.textContent = '00:00:00';
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

    listenBtn.addEventListener('click', function() {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    });

    modelSelect.addEventListener('change', function() {
        fetch(`/switch_model/${this.value}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                currentModelText.textContent = this.options[this.selectedIndex].text;
            } else {
                alert('Error switching model: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error switching model');
        });
    });

    socket.on('detection_result', function(data) {
        const confidence = Math.round(data.confidence * 100);
        confidenceBar.style.width = `${confidence}%`;
        confidenceText.textContent = `${confidence}%`;

        if (data.detected) {
            alertBox.classList.remove('hidden');
            alertBox.classList.add('alert-animation');
            new Audio('/static/alert.mp3').play().catch(e => console.log('Audio play failed:', e));
        } else {
            alertBox.classList.add('hidden');
            alertBox.classList.remove('alert-animation');
        }
    });

    socket.on('error', function(data) {
        console.error('Socket error:', data.message);
        alert('Error: ' + data.message);
    });
});
