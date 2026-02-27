/* ========================================
   Eco Innovation - Utility Functions
   ======================================== */

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format date to readable format
 */
function formatDate(date, format = 'short') {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
  };

  return new Intl.DateTimeFormat('id-ID', options[format] || options.short).format(date);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Show loading indicator
 */
function showLoading(message = 'Loading...') {
  const loader = document.getElementById('loadingIndicator');
  if (loader) {
    loader.style.display = 'flex';
    const text = loader.querySelector('p');
    if (text) text.textContent = message;
  }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loader = document.getElementById('loadingIndicator');
  if (loader) {
    loader.style.display = 'none';
  }
}

/**
 * Show error message
 */
function showError(message, duration = 5000) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    const errorText = errorDiv.querySelector('#errorText');
    if (errorText) {
      errorText.textContent = message;
      errorDiv.style.display = 'block';

      if (duration > 0) {
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, duration);
      }
    }
  }
}

/**
 * Show success notification
 */
function showSuccess(message, duration = 3000) {
  const notification = document.createElement('div');
  notification.className = 'notification notification-success';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">✓</span>
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Check if device has camera
 */
async function hasCameraSupport() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error checking camera support:', error);
    return false;
  }
}

/**
 * Request camera permission
 */
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

/**
 * Check if device has geolocation
 */
function hasGeolocationSupport() {
  return 'geolocation' in navigator;
}

/**
 * Get current location
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!hasGeolocationSupport()) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      error => {
        reject(error);
      }
    );
  });
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress image
 */
function compressImage(file, quality = 0.8, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if browser supports service workers
 */
function hasServiceWorkerSupport() {
  return 'serviceWorker' in navigator;
}

/**
 * Check if app is online
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parse query parameters from URL
 */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params);
}

/**
 * Format number to currency
 */
function formatCurrency(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Parse timestamp to relative time (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [key, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Export data to JSON file
 */
function exportToJSON(data, filename = 'data.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
function exportToCSV(data, filename = 'data.csv') {
  if (!Array.isArray(data) || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const cell = row[header];
        if (typeof cell === 'string' && cell.includes(',')) {
          return `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if string is valid email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Create modal
 */
function createModal(content, title = '') {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close">&times;</button>
      ${title ? `<h3>${title}</h3>` : ''}
      <div>${content}</div>
    </div>
  `;

  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
  return modal;
}

/**
 * Wait for element to exist in DOM
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Create a canvas from video element
 */
function getCanvasFromVideo(video) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas;
}

/**
 * Resize canvas to specific dimensions
 */
function resizeCanvas(canvas, width, height) {
  const resized = document.createElement('canvas');
  resized.width = width;
  resized.height = height;
  const ctx = resized.getContext('2d');
  ctx.drawImage(canvas, 0, 0, width, height);
  return resized;
}

/**
 * Batch process async operations
 */
async function processBatch(items, batchSize = 10, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

console.log('Utils loaded successfully');
