/* ========================================
   Eco Innovation - Map Module
   ======================================== */

class MapManager {
  constructor(mapElementId) {
    this.mapElement = document.getElementById(mapElementId);
    this.map = null;
    this.userMarker = null;
    this.locationMarkers = [];
    this.userLocation = null;
    this.selectedLocation = null;

    // Sample TPS and Bank Sampah locations
    this.locations = [
      {
        id: 1,
        name: 'TPS Kelurahan Merdeka',
        address: 'Jl. Merdeka No. 123, Jakarta',
        phone: '021-1234567',
        type: 'tps',
        hours: '06:00 - 18:00',
        rating: 4.5,
        latitude: -6.2088,
        longitude: 106.8456
      },
      {
        id: 2,
        name: 'Bank Sampah Hijau Bangkit',
        address: 'Jl. Sudirman No. 456, Jakarta',
        phone: '021-2345678',
        type: 'bank',
        hours: '08:00 - 17:00',
        rating: 4.8,
        latitude: -6.2165,
        longitude: 106.8272
      },
      {
        id: 3,
        name: 'Pusat Daur Ulang Bersama',
        address: 'Jl. Ahmad Yani No. 789, Jakarta',
        phone: '021-3456789',
        type: 'recycle',
        hours: '07:00 - 19:00',
        rating: 4.6,
        latitude: -6.1753,
        longitude: 106.8294
      },
      {
        id: 4,
        name: 'TPS Komunitas Hijau',
        address: 'Jl. Gatot Subroto No. 321, Jakarta',
        phone: '021-4567890',
        type: 'tps',
        hours: '06:00 - 20:00',
        rating: 4.3,
        latitude: -6.2256,
        longitude: 106.8119
      },
      {
        id: 5,
        name: 'Bank Sampah Sejahtera',
        address: 'Jl. Rasuna Said No. 654, Jakarta',
        phone: '021-5678901',
        type: 'bank',
        hours: '08:00 - 16:00',
        rating: 4.7,
        latitude: -6.2331,
        longitude: 106.8243
      }
    ];
  }

  /**
   * Initialize map
   */
  initMap() {
    try {
      if (!this.mapElement) {
        console.error('Map element not found');
        return false;
      }

      // Check if Google Maps API is loaded
      if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        showError('Google Maps API tidak berhasil dimuat');
        return false;
      }

      // Default center (Indonesia center)
      const defaultCenter = { lat: -6.2088, lng: 106.8456 };

      this.map = new google.maps.Map(this.mapElement, {
        zoom: 13,
        center: defaultCenter,
        fullscreenControl: true,
        mapTypeControl: true,
        zoomControl: true,
        streetViewControl: true
      });

      console.log('Map initialized successfully');
      return true;
    } catch (error) {
      console.error('Map initialization error:', error);
      showError('Gagal menginisialisasi peta');
      return false;
    }
  }

  /**
   * Get user location
   */
  async getUserLocation() {
    try {
      showLoading('Mendapatkan lokasi Anda...');
      const location = await getCurrentLocation();
      hideLoading();

      this.userLocation = {
        lat: location.latitude,
        lng: location.longitude
      };

      this.addUserMarker();
      this.centerMapOnUser();
      return location;
    } catch (error) {
      hideLoading();
      console.error('Error getting location:', error);
      showError('Gagal mendapatkan lokasi: ' + error.message);
      return null;
    }
  }

  /**
   * Add user marker
   */
  addUserMarker() {
    if (!this.map || !this.userLocation) return;

    if (this.userMarker) {
      this.userMarker.setMap(null);
    }

    this.userMarker = new google.maps.Marker({
      position: this.userLocation,
      map: this.map,
      title: 'Lokasi Anda',
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });
  }

  /**
   * Center map on user
   */
  centerMapOnUser() {
    if (this.map && this.userLocation) {
      this.map.setCenter(this.userLocation);
      this.map.setZoom(14);
    }
  }

  /**
   * Display locations on map
   */
  displayLocations(radius = 5, typeFilter = '') {
    try {
      // Clear existing markers
      this.locationMarkers.forEach(marker => marker.setMap(null));
      this.locationMarkers = [];

      if (!this.map) return;

      // Filter locations
      let filteredLocations = this.locations;

      if (typeFilter) {
        filteredLocations = filteredLocations.filter(loc => loc.type === typeFilter);
      }

      // Calculate distances if user location exists
      if (this.userLocation) {
        filteredLocations = filteredLocations
          .map(loc => ({
            ...loc,
            distance: calculateDistance(
              this.userLocation.lat,
              this.userLocation.lng,
              loc.latitude,
              loc.longitude
            )
          }))
          .filter(loc => loc.distance <= radius)
          .sort((a, b) => a.distance - b.distance);
      }

      // Add markers for each location
      filteredLocations.forEach((location, index) => {
        const marker = new google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: this.map,
          title: location.name,
          label: (index + 1).toString(),
          icon: this.getMarkerIcon(location.type)
        });

        marker.addListener('click', () => {
          this.showLocationDetail(location);
        });

        this.locationMarkers.push(marker);
      });

      // Display locations in list
      this.displayLocationList(filteredLocations);

      showSuccess(`Ditemukan ${filteredLocations.length} lokasi`);
    } catch (error) {
      console.error('Error displaying locations:', error);
      showError('Gagal menampilkan lokasi');
    }
  }

  /**
   * Get marker icon based on location type
   */
  getMarkerIcon(type) {
    const icons = {
      'tps': 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      'bank': 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      'recycle': 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    };
    return icons[type] || 'http://maps.google.com/mapfiles/ms/icons/gray-dot.png';
  }

  /**
   * Display location list
   */
  displayLocationList(locations) {
    const listContainer = document.getElementById('locationList');
    if (!listContainer) return;

    if (locations.length === 0) {
      listContainer.innerHTML = '<p class="empty-list">Tidak ada lokasi dalam radius ini</p>';
      return;
    }

    listContainer.innerHTML = locations.map((loc, index) => `
      <div class="location-item" onclick="mapManager.showLocationDetail(${JSON.stringify(loc).replace(/"/g, '&quot;')})">
        <div class="location-number">${index + 1}</div>
        <div class="location-info">
          <h4>${loc.name}</h4>
          <p class="location-type">${this.getTypeLabel(loc.type)}</p>
          <p class="location-address">📍 ${loc.address}</p>
          ${loc.distance ? `<p class="location-distance">📏 ${loc.distance.toFixed(1)} km</p>` : ''}
          <p class="location-rating">⭐ ${loc.rating}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Get type label
   */
  getTypeLabel(type) {
    const labels = {
      'tps': 'Tempat Pembuangan Sampah',
      'bank': 'Bank Sampah',
      'recycle': 'Pusat Daur Ulang'
    };
    return labels[type] || type;
  }

  /**
   * Show location detail
   */
  showLocationDetail(location) {
    const modal = document.getElementById('locationModal');
    if (!modal) return;

    this.selectedLocation = location;

    // Update modal content
    document.getElementById('modalLocationName').textContent = location.name;
    document.getElementById('modalLocationAddress').textContent = location.address;
    document.getElementById('modalLocationPhone').textContent = location.phone || 'Tidak tersedia';
    document.getElementById('modalLocationHours').textContent = location.hours || 'Tidak tersedia';
    document.getElementById('modalLocationType').textContent = this.getTypeLabel(location.type);
    document.getElementById('modalLocationRating').textContent = location.rating + ' ⭐';

    if (this.userLocation) {
      const distance = calculateDistance(
        this.userLocation.lat,
        this.userLocation.lng,
        location.latitude,
        location.longitude
      );
      document.getElementById('modalLocationDistance').textContent = distance.toFixed(1) + ' km';
    }

    // Setup buttons
    const navBtn = document.getElementById('navigationBtn');
    const callBtn = document.getElementById('callBtn');

    if (navBtn) {
      navBtn.onclick = () => this.navigateTo(location);
    }

    if (callBtn) {
      callBtn.onclick = () => this.callLocation(location);
      if (location.phone) {
        callBtn.style.display = 'block';
      } else {
        callBtn.style.display = 'none';
      }
    }

    // Show modal
    modal.style.display = 'flex';
  }

  /**
   * Navigate to location
   */
  navigateTo(location) {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
    window.open(googleMapsUrl, '_blank');
  }

  /**
   * Call location
   */
  callLocation(location) {
    if (location.phone) {
      window.location.href = `tel:${location.phone}`;
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Search locations
   */
  searchLocations(query) {
    const filtered = this.locations.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.address.toLowerCase().includes(query.toLowerCase())
    );

    this.displayLocationList(filtered);
  }
}

/**
 * Global map manager instance
 */
let mapManager = null;

/**
 * Initialize map manager
 */
function initializeMapManager() {
  if (!mapManager) {
    mapManager = new MapManager('map');
    if (mapManager.initMap()) {
      return mapManager;
    }
  }
  return mapManager;
}

/**
 * Setup map controls
 */
function setupMapControls() {
  const updateBtn = document.getElementById('updateMapBtn');
  const locationBtn = document.getElementById('getLocationBtn');
  const typeFilter = document.getElementById('locationTypeFilter');
  const radiusFilter = document.getElementById('radiusFilter');
  const modalClose = document.querySelector('#locationModal .modal-close');

  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      const type = typeFilter?.value || '';
      const radius = parseInt(radiusFilter?.value || 5);
      mapManager.displayLocations(radius, type);
    });
  }

  if (locationBtn) {
    locationBtn.addEventListener('click', async () => {
      await mapManager.getUserLocation();
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => mapManager.closeModal());
  }

  // Initial load
  mapManager.displayLocations(5, '');
}

/**
 * Initialize map on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('map-page')) {
    mapManager = initializeMapManager();
    if (mapManager) {
      setupMapControls();
    }
  }
});

console.log('Map module loaded successfully');
