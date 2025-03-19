import logging
import numpy as np
import pyaudio
from scipy.fft import fft
import torch

class AudioProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.running = False
        self.current_model = "fpv"
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.chunk_size = 1024
        self.sample_rate = 16000

        # Define frequency ranges for different drone types
        self.frequency_ranges = {
            "fpv": (2000, 6000),  # Example frequency range for FPV drones
            "shahed": (500, 2000)  # Example frequency range for Shahed drones
        }

    def start(self):
        if not self.running:
            self.stream = self.audio.open(
                format=pyaudio.paFloat32,
                channels=1,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size
            )
            self.running = True
            self.logger.info("Audio detection started")

    def stop(self):
        if self.running:
            self.stream.stop_stream()
            self.stream.close()
            self.running = False
            self.logger.info("Audio detection stopped")

    def switch_model(self, model_type):
        if model_type in self.frequency_ranges:
            self.current_model = model_type
            self.logger.info(f"Switched to {model_type} model")
        else:
            raise ValueError(f"Unknown model type: {model_type}")

    def process_audio(self, audio_data):
        try:
            # Convert audio data to numpy array
            audio_np = np.frombuffer(audio_data, dtype=np.float32)

            # Perform FFT
            fft_data = fft(audio_np)
            fft_freq = np.fft.fftfreq(len(fft_data), 1/self.sample_rate)
            fft_magnitude = np.abs(fft_data)

            # Get frequency range for current model
            freq_min, freq_max = self.frequency_ranges[self.current_model]

            # Calculate energy in the target frequency range
            mask = (fft_freq >= freq_min) & (fft_freq <= freq_max)
            target_energy = np.sum(fft_magnitude[mask])
            total_energy = np.sum(fft_magnitude)

            # Calculate confidence based on energy ratio
            confidence = min(target_energy / (total_energy + 1e-10), 1.0)

            return {
                "detected": confidence > 0.8,
                "confidence": confidence,
                "model_type": self.current_model,
                "status": "active"
            }
        except Exception as e:
            self.logger.error(f"Error processing audio: {str(e)}")
            raise

    def __del__(self):
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.audio.terminate()