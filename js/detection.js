/* ========================================
   Eco Innovation - Detection Module (TensorFlow.js)
   ======================================== */

class WasteDetector {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.wasteDatabase = null;
  }

  /**
   * Load MobileNet model
   */
  async loadModel() {
    try {
      showLoading('Memuat model deteksi...');
      this.model = await mobilenet.load();
      this.isModelLoaded = true;
      console.log('Model loaded successfully');
      hideLoading();
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      hideLoading();
      return false;
    }
  }

  /**
   * Load waste database
   */
  async loadWasteDatabase() {
    try {
      const response = await fetch('data/waste-database.json');
      this.wasteDatabase = await response.json();
      console.log('Waste database loaded:', this.wasteDatabase);
      return true;
    } catch (error) {
      console.error('Error loading waste database:', error);
      return false;
    }
  }

  /**
   * Predict waste from image/canvas
   */
  async predict(imageInput) {
    try {
      if (!this.isModelLoaded) {
        throw new Error('Model not loaded');
      }

      showLoading('Menganalisis sampah...');

      // Convert canvas to tensor
      let tensor;
      if (imageInput instanceof HTMLCanvasElement) {
        tensor = tf.browser.fromPixels(imageInput);
      } else if (imageInput instanceof HTMLImageElement) {
        tensor = tf.browser.fromPixels(imageInput);
      } else {
        throw new Error('Invalid image input');
      }

      // Make prediction
      const predictions = await this.model.classify(tensor, 5); // Top 5 predictions
      tensor.dispose();

      hideLoading();

      return predictions;
    } catch (error) {
      console.error('Prediction error:', error);
      hideLoading();
      throw error;
    }
  }

  /**
   * Map prediction to waste category
   */
  mapPredictionToWaste(predictions) {
    if (!predictions || predictions.length === 0) {
      return null;
    }

    // Get top prediction
    const topPrediction = predictions[0];
    const label = topPrediction.className.toLowerCase();
    const confidence = Math.round(topPrediction.probability * 100);

    // Search in waste database
    let matchedWaste = null;

    if (this.wasteDatabase && Array.isArray(this.wasteDatabase)) {
      matchedWaste = this.wasteDatabase.find(waste => {
        if (waste.ml_labels && Array.isArray(waste.ml_labels)) {
          return waste.ml_labels.some(mlLabel =>
            label.includes(mlLabel.toLowerCase()) ||
            mlLabel.toLowerCase().includes(label)
          );
        }
        return false;
      });
    }

    if (!matchedWaste && this.wasteDatabase && Array.isArray(this.wasteDatabase)) {
      // Try to find by category name
      const category = extractWasteCategory(label);
      matchedWaste = this.wasteDatabase.find(waste =>
        waste.category.toLowerCase() === category.toLowerCase()
      );
    }

    return {
      label,
      confidence,
      predictions,
      waste: matchedWaste || getDefaultWasteInfo(label, confidence)
    };
  }

  /**
   * Full detection pipeline
   */
  async detectWaste(imageInput) {
    try {
      const predictions = await this.predict(imageInput);
      const result = this.mapPredictionToWaste(predictions);
      return result;
    } catch (error) {
      console.error('Detection error:', error);
      throw error;
    }
  }
}

/**
 * Extract waste category from label
 */
function extractWasteCategory(label) {
  const categoryMap = {
    'plastic': 'Plastik',
    'bottle': 'Plastik',
    'bag': 'Plastik',
    'cup': 'Plastik',
    'paper': 'Kertas',
    'cardboard': 'Kertas',
    'metal': 'Logam',
    'can': 'Logam',
    'aluminum': 'Logam',
    'glass': 'Kaca',
    'bottle': 'Kaca',
    'organic': 'Organik',
    'food': 'Organik',
    'fruit': 'Organik',
    'electronic': 'Elektronik',
    'phone': 'Elektronik',
    'computer': 'Elektronik'
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (label.includes(key)) {
      return value;
    }
  }

  return 'Lainnya';
}

/**
 * Get default waste info if not found in database
 */
function getDefaultWasteInfo(label, confidence) {
  const category = extractWasteCategory(label);
  const icon = getCategoryIcon(category);

  return {
    id: label.replace(/\s+/g, '_').toLowerCase(),
    name: capitalize(label),
    category: category,
    color: getCategoryColor(category),
    icon: icon,
    description: `Ini adalah sampah jenis ${label}. Silahkan periksa kategorinya untuk informasi lebih lanjut.`,
    pengelolaan: `Untuk sampah jenis ${label}, pastikan untuk memisahkan dengan sampah lainnya dan membuangnya ke tempat yang sesuai.`,
    daur_ulang: `${label} dapat didaur ulang jika dalam kondisi yang baik. Pastikan untuk membersihkan sebelum membuangnya.`,
    tips: [
      'Pisahkan dengan sampah lainnya',
      'Bersihkan jika diperlukan',
      'Buang ke tempat yang sesuai',
      'Pertimbangkan untuk didaur ulang'
    ],
    ml_labels: [label.toLowerCase()]
  };
}

/**
 * Get category icon
 */
function getCategoryIcon(category) {
  const icons = {
    'Plastik': '🍾',
    'Kertas': '📄',
    'Logam': '🧲',
    'Kaca': '🥤',
    'Organik': '🌱',
    'Elektronik': '🔌',
    'Lainnya': '♻️'
  };
  return icons[category] || '♻️';
}

/**
 * Get category color
 */
function getCategoryColor(category) {
  const colors = {
    'Plastik': '#FF6B6B',
    'Kertas': '#FFD93D',
    'Logam': '#A8DADC',
    'Kaca': '#4ECDC4',
    'Organik': '#52B788',
    'Elektronik': '#457B9D',
    'Lainnya': '#95B8D1'
  };
  return colors[category] || '#10B981';
}

/**
 * Global detector instance
 */
let wasteDetector = null;

/**
 * Initialize detector
 */
async function initializeDetector() {
  if (!wasteDetector) {
    wasteDetector = new WasteDetector();
    const modelLoaded = await wasteDetector.loadModel();
    const dbLoaded = await wasteDetector.loadWasteDatabase();

    if (!modelLoaded || !dbLoaded) {
      console.warn('Warning: Detector initialization incomplete');
      return false;
    }
  }
  return true;
}

/**
 * Perform waste detection
 */
async function performDetection(canvas, blob) {
  try {
    if (!wasteDetector) {
      const initialized = await initializeDetector();
      if (!initialized) {
        showError('Gagal memuat model deteksi. Silahkan muat ulang halaman.');
        return;
      }
    }

    const result = await wasteDetector.detectWaste(canvas);
    displayDetectionResult(result, blob);
  } catch (error) {
    console.error('Detection error:', error);
    showError('Gagal mendeteksi sampah: ' + error.message);
  }
}

/**
 * Display detection result
 */
function displayDetectionResult(result, blob) {
  const resultsSection = document.getElementById('resultsSection');
  const resultImage = document.getElementById('resultImage');
  const wasteName = document.getElementById('wasteName');
  const confidenceText = document.getElementById('confidenceText');
  const confidenceFill = document.getElementById('confidenceFill');
  const wasteDescription = document.getElementById('wasteDescription');
  const wasteManagement = document.getElementById('wasteManagement');
  const wasteRecycling = document.getElementById('wasteRecycling');
  const wasteTips = document.getElementById('wasteTips');

  if (!resultsSection) return;

  // Set image
  if (blob) {
    const reader = new FileReader();
    reader.onload = (e) => {
      resultImage.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  } else if (cameraManager) {
    const canvas = cameraManager.captureFrame();
    resultImage.src = canvas.toDataURL();
  }

  // Set waste info
  const waste = result.waste;
  wasteName.textContent = waste.name || 'Tidak Dikenal';
  wasteName.style.color = waste.color || '#10B981';

  // Set confidence
  confidenceFill.style.width = result.confidence + '%';
  confidenceText.textContent = result.confidence + '%';

  // Set descriptions
  wasteDescription.textContent = waste.description || 'Tidak ada deskripsi';

  if (waste.pengelolaan) {
    wasteManagement.innerHTML = `<p>${waste.pengelolaan}</p>`;
  } else {
    wasteManagement.textContent = 'Tidak ada informasi pengelolaan';
  }

  if (waste.daur_ulang) {
    wasteRecycling.innerHTML = `<p>${waste.daur_ulang}</p>`;
  } else {
    wasteRecycling.textContent = 'Tidak ada informasi daur ulang';
  }

  // Set tips
  if (waste.tips && Array.isArray(waste.tips)) {
    wasteTips.innerHTML = waste.tips
      .map(tip => `<li>${tip}</li>`)
      .join('');
  } else {
    wasteTips.innerHTML = '<li>Tidak ada tips</li>';
  }

  // Show results section
  resultsSection.style.display = 'block';

  // Store detected result globally
  window.lastDetectionResult = {
    waste: waste,
    confidence: result.confidence,
    timestamp: new Date(),
    imageData: resultImage.src
  };

  showSuccess('Deteksi berhasil!');
}

/**
 * Make detector globally accessible
 */
window.performDetection = performDetection;
window.wasteDetector = wasteDetector;

/**
 * Initialize detector on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (document.body.classList.contains('detect-page')) {
    const initialized = await initializeDetector();
    if (initialized) {
      console.log('Detector ready');
    }
  }
});

console.log('Detection module loaded successfully');
