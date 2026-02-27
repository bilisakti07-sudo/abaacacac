/* ========================================
   Eco Innovation - Camera Module
   ======================================== */

class CameraManager {
  constructor(videoElementId) {
    this.videoElement = document.getElementById(videoElementId);
    this.stream = null;
    this.devices = [];
    this.currentDeviceId = null;
    this.constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
  }

  /**
   * Initialize camera
   */
  async initialize() {
    try {
      // Check if camera is available
      await this.getVideoDevices();

      if (this.devices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Try to get user media
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play().catch(error => {
            console.error('Error playing video:', error);
          });
        };
      }

      console.log('Camera initialized successfully');
      return true;
    } catch (error) {
      console.error('Camera initialization error:', error);
      return false;
    }
  }

  /**
   * Get available video devices
   */
  async getVideoDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      console.log('Found video devices:', this.devices);
      return this.devices;
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera() {
    try {
      if (this.devices.length <= 1) {
        throw new Error('Only one camera available');
      }

      // Stop current stream
      this.stop();

      // Get all video devices
      const devices = await this.getVideoDevices();
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      // Switch to next device
      const currentIndex = devices.findIndex(d => d.deviceId === this.currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      this.currentDeviceId = devices[nextIndex].deviceId;

      // Update constraints with specific device
      this.constraints.video.deviceId = this.currentDeviceId;

      // Initialize with new device
      return await this.initialize();
    } catch (error) {
      console.error('Error switching camera:', error);
      return false;
    }
  }

  /**
   * Capture frame from video
   */
  captureFrame() {
    try {
      const canvas = document.createElement('canvas');
      const video = this.videoElement;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      return canvas;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Capture frame as blob
   */
  async captureFrameAsBlob(quality = 0.9) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = this.captureFrame();
        if (!canvas) {
          reject(new Error('Failed to capture frame'));
          return;
        }

        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/jpeg', quality);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop camera stream
   */
  stop() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
        });
        this.stream = null;

        if (this.videoElement) {
          this.videoElement.srcObject = null;
        }
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  /**
   * Check if camera is running
   */
  isRunning() {
    return this.stream && this.stream.active;
  }

  /**
   * Get video element dimensions
   */
  getDimensions() {
    if (!this.videoElement) {
      return { width: 0, height: 0 };
    }

    return {
      width: this.videoElement.videoWidth || this.videoElement.width,
      height: this.videoElement.videoHeight || this.videoElement.height
    };
  }

  /**
   * Take screenshot and download
   */
  downloadScreenshot() {
    try {
      const canvas = this.captureFrame();
      if (!canvas) {
        throw new Error('Failed to capture frame');
      }

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg');
      link.download = `screenshot-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading screenshot:', error);
    }
  }
}

/**
 * Initialize camera manager globally
 */
let cameraManager = null;

function initializeCameraManager() {
  const videoElement = document.getElementById('cameraFeed');
  if (videoElement && !cameraManager) {
    cameraManager = new CameraManager('cameraFeed');
  }
  return cameraManager;
}

/**
 * Setup camera controls
 */
function setupCameraControls() {
  const captureBtn = document.getElementById('captureBtn');
  const resetBtn = document.getElementById('cameraReset');
  const switchBtn = document.getElementById('cameraBtnSwitch');

  if (captureBtn) {
    captureBtn.addEventListener('click', async () => {
      await handleCapture();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  if (switchBtn) {
    switchBtn.addEventListener('click', async () => {
      const success = await cameraManager.switchCamera();
      if (success) {
        showSuccess('Kamera berhasil diubah');
      } else {
        showError('Gagal mengubah kamera');
      }
    });
  }
}

/**
 * Handle capture button click
 */
async function handleCapture() {
  showLoading('Menangkap foto...');

  try {
    if (!cameraManager || !cameraManager.isRunning()) {
      throw new Error('Kamera tidak aktif');
    }

    const blob = await cameraManager.captureFrameAsBlob();
    const canvas = cameraManager.captureFrame();

    hideLoading();

    // Send to detection
    if (window.performDetection) {
      await window.performDetection(canvas, blob);
    }
  } catch (error) {
    hideLoading();
    console.error('Capture error:', error);
    showError('Gagal menangkap foto: ' + error.message);
  }
}

/**
 * Handle reset button click
 */
function handleReset() {
  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }

  if (cameraManager) {
    cameraManager.initialize();
  }
}

/**
 * Handle camera permission error
 */
function handleCameraPermissionError() {
  const permissionStatus = document.getElementById('permissionStatus');
  const errorMessage = document.getElementById('errorMessage');
  const requestBtn = document.getElementById('requestPermissionBtn');

  if (permissionStatus) {
    permissionStatus.style.display = 'block';
    const messageEl = permissionStatus.querySelector('#permissionMessage');
    if (messageEl) {
      messageEl.textContent = 'Aplikasi memerlukan akses ke kamera untuk mendeteksi sampah.';
    }

    if (requestBtn) {
      requestBtn.addEventListener('click', async () => {
        const success = await requestCameraPermission();
        if (success) {
          permissionStatus.style.display = 'none';
          await initializeCameraManager();
          await cameraManager.initialize();
        } else {
          showError('Izin kamera ditolak. Silahkan coba lagi.');
        }
      });
    }
  }
}

/**
 * Initialize camera on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (document.body.classList.contains('detect-page')) {
    const manager = initializeCameraManager();

    if (manager) {
      const initialized = await manager.initialize();

      if (!initialized) {
        handleCameraPermissionError();
      } else {
        setupCameraControls();
      }
    }
  }
});

console.log('Camera module loaded successfully');
