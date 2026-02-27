/* ========================================
   Eco Innovation - History Module
   ======================================== */

class HistoryManager {
  constructor() {
    this.allScans = [];
    this.filteredScans = [];
    this.db = initializeDatabaseManager();
    this.sortBy = 'newest';
    this.filterBy = '';
  }

  /**
   * Load scan history
   */
  async loadHistory() {
    try {
      showLoading('Memuat riwayat...');
      this.allScans = await this.db.getScanHistory(500);
      this.filteredScans = [...this.allScans];
      hideLoading();
      return this.allScans;
    } catch (error) {
      hideLoading();
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Render history list
   */
  renderHistory(scans = this.filteredScans) {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');

    if (!historyList) return;

    if (scans.length === 0) {
      historyList.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    historyList.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    historyList.innerHTML = scans.map((scan, index) => `
      <div class="history-item" style="--item-index: ${index}">
        <div class="history-item-image">
          ${scan.imageData ? `<img src="${scan.imageData}" alt="${scan.waste.name}">` : '<div class="image-placeholder">📷</div>'}
        </div>
        <div class="history-item-content">
          <div class="history-item-header">
            <h4 class="history-item-title">${scan.waste.name}</h4>
            <span class="history-item-confidence">${scan.confidence}%</span>
          </div>
          <div class="history-item-meta">
            <span class="history-item-category" style="background-color: ${scan.waste.color}">
              ${scan.waste.category}
            </span>
            <span class="history-item-date">${formatDate(scan.timestamp, 'time')}</span>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="btn-icon" onclick="historyManager.viewDetail('${scan.id}')" title="Lihat Detail">👁️</button>
          <button class="btn-icon" onclick="historyManager.deleteItem('${scan.id}')" title="Hapus">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Filter history by waste type
   */
  filterByType(category) {
    this.filterBy = category;
    if (category === '') {
      this.filteredScans = [...this.allScans];
    } else {
      this.filteredScans = this.allScans.filter(scan =>
        scan.waste.category.toLowerCase() === category.toLowerCase()
      );
    }
    this.sort(this.sortBy);
    this.renderHistory();
  }

  /**
   * Search history
   */
  search(query) {
    const searchTerm = query.toLowerCase();
    this.filteredScans = this.allScans.filter(scan =>
      scan.waste.name.toLowerCase().includes(searchTerm) ||
      scan.waste.category.toLowerCase().includes(searchTerm)
    );
    this.sort(this.sortBy);
    this.renderHistory();
  }

  /**
   * Sort history
   */
  sort(sortType) {
    this.sortBy = sortType;

    switch (sortType) {
      case 'newest':
        this.filteredScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'oldest':
        this.filteredScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case 'alphabetical':
        this.filteredScans.sort((a, b) => a.waste.name.localeCompare(b.waste.name));
        break;
      case 'highest-confidence':
        this.filteredScans.sort((a, b) => b.confidence - a.confidence);
        break;
    }

    this.renderHistory();
  }

  /**
   * Delete scan from history
   */
  async deleteItem(scanId) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      return;
    }

    try {
      const success = await this.db.deleteScan(scanId);
      if (success) {
        this.allScans = this.allScans.filter(scan => scan.id !== scanId);
        this.filteredScans = this.filteredScans.filter(scan => scan.id !== scanId);
        this.renderHistory();
        showSuccess('Item berhasil dihapus');
      } else {
        showError('Gagal menghapus item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Gagal menghapus item: ' + error.message);
    }
  }

  /**
   * Delete all history
   */
  async deleteAll() {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat scan? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      showLoading('Menghapus semua riwayat...');
      const success = await this.db.clearScanHistory();
      hideLoading();

      if (success) {
        this.allScans = [];
        this.filteredScans = [];
        this.renderHistory();
        showSuccess('Semua riwayat berhasil dihapus');
      } else {
        showError('Gagal menghapus riwayat');
      }
    } catch (error) {
      hideLoading();
      console.error('Error deleting all:', error);
      showError('Gagal menghapus riwayat');
    }
  }

  /**
   * View detail of a scan
   */
  viewDetail(scanId) {
    const scan = this.allScans.find(s => s.id === scanId);
    if (!scan) return;

    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
      <h3>${scan.waste.icon} ${scan.waste.name}</h3>
      ${scan.imageData ? `<img src="${scan.imageData}" style="width: 100%; border-radius: 8px; margin: 1rem 0;">` : ''}

      <div class="detail-info">
        <p><strong>Kategori:</strong> ${scan.waste.category}</p>
        <p><strong>Akurasi:</strong> ${scan.confidence}%</p>
        <p><strong>Tanggal:</strong> ${formatDate(scan.timestamp, 'time')}</p>
        ${scan.latitude ? `<p><strong>Lokasi:</strong> ${scan.latitude.toFixed(4)}, ${scan.longitude.toFixed(4)}</p>` : ''}
      </div>

      <div class="detail-section">
        <h4>Deskripsi</h4>
        <p>${scan.waste.description}</p>
      </div>

      <div class="detail-section">
        <h4>Cara Pengelolaan</h4>
        <p>${scan.waste.pengelolaan}</p>
      </div>

      <div class="detail-section">
        <h4>Daur Ulang</h4>
        <p>${scan.waste.daur_ulang}</p>
      </div>

      <div class="detail-section">
        <h4>Tips</h4>
        <ul>
          ${scan.waste.tips ? scan.waste.tips.map(tip => `<li>${tip}</li>`).join('') : '<li>Tidak ada tips</li>'}
        </ul>
      </div>

      <button class="btn btn-secondary" onclick="document.getElementById('detailModal').style.display='none'">Tutup</button>
    `;

    modal.style.display = 'flex';
  }

  /**
   * Export history to JSON
   */
  async exportToJSON() {
    try {
      const data = await this.db.exportScanHistory();
      if (data) {
        exportToJSON(data, `eco-innovation-history-${Date.now()}.json`);
        showSuccess('Riwayat berhasil diexport');
      } else {
        showError('Gagal mengexport riwayat');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('Gagal mengexport riwayat');
    }
  }

  /**
   * Export history to CSV
   */
  async exportToCSV() {
    try {
      const csvData = this.allScans.map(scan => ({
        'Tanggal': formatDate(scan.timestamp, 'time'),
        'Sampah': scan.waste.name,
        'Kategori': scan.waste.category,
        'Akurasi': scan.confidence + '%',
        'Latitude': scan.latitude || '',
        'Longitude': scan.longitude || ''
      }));

      exportToCSV(csvData, `eco-innovation-history-${Date.now()}.csv`);
      showSuccess('Riwayat berhasil diexport ke CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      showError('Gagal mengexport ke CSV');
    }
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    try {
      return await this.db.getUserStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalScans: 0,
        totalRecycled: 0,
        co2Saved: '0',
        wasteByCategory: {}
      };
    }
  }

  /**
   * Display statistics
   */
  async displayStatistics() {
    try {
      const stats = await this.getStatistics();
      const level = await this.db.getUserLevel();

      const totalScansEl = document.getElementById('totalScansUser');
      const totalRecycledEl = document.getElementById('totalRecycled');
      const co2SavedEl = document.getElementById('co2Saved');
      const userLevelEl = document.getElementById('userLevel');

      if (totalScansEl) totalScansEl.textContent = stats.totalScans;
      if (totalRecycledEl) totalRecycledEl.textContent = stats.totalScans;
      if (co2SavedEl) co2SavedEl.textContent = stats.co2Saved + ' kg';
      if (userLevelEl) userLevelEl.textContent = level;

      return stats;
    } catch (error) {
      console.error('Error displaying stats:', error);
      return null;
    }
  }
}

/**
 * Global history manager instance
 */
let historyManager = null;

/**
 * Initialize history manager
 */
function initializeHistoryManager() {
  if (!historyManager) {
    historyManager = new HistoryManager();
  }
  return historyManager;
}

/**
 * Setup event listeners for history page
 */
function setupHistoryControls() {
  const searchInput = document.getElementById('searchInput');
  const wasteTypeFilter = document.getElementById('wasteTypeFilter');
  const sortBy = document.getElementById('sortBy');
  const exportBtn = document.getElementById('exportHistoryBtn');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const detailModal = document.getElementById('detailModal');
  const modalClose = detailModal?.querySelector('.modal-close');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      historyManager.search(e.target.value);
    });
  }

  if (wasteTypeFilter) {
    wasteTypeFilter.addEventListener('change', (e) => {
      historyManager.filterByType(e.target.value);
    });
  }

  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      historyManager.sort(e.target.value);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      historyManager.exportToJSON();
    });
  }

  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      historyManager.deleteAll();
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      detailModal.style.display = 'none';
    });
  }

  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        detailModal.style.display = 'none';
      }
    });
  }
}

/**
 * Initialize history on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (document.body.classList.contains('history-page')) {
    historyManager = initializeHistoryManager();
    setupHistoryControls();

    // Load and display history
    await historyManager.loadHistory();
    historyManager.renderHistory();
    await historyManager.displayStatistics();
  }
});

console.log('History module loaded successfully');
