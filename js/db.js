/* ========================================
   Eco Innovation - Database Module
   ======================================== */

class DatabaseManager {
  constructor() {
    this.db = null;
    this.auth = null;
    this.storage = null;
    this.currentUser = null;

    // Initialize Firebase references
    if (window.firebaseConfig) {
      this.db = window.firebaseConfig.db;
      this.auth = window.firebaseConfig.auth;
      this.storage = window.firebaseConfig.storage;
    }
  }

  /**
   * Save scan history to Firestore
   */
  async saveScanHistory(scanData) {
    try {
      if (!this.auth.currentUser) {
        // Use local storage if not logged in
        return this.saveScanHistoryLocal(scanData);
      }

      const userId = this.auth.currentUser.uid;
      const docRef = await this.db.collection('users').doc(userId)
        .collection('scans').add({
          ...scanData,
          timestamp: new Date(),
          userId: userId
        });

      console.log('Scan saved with ID:', docRef.id);
      return { id: docRef.id, ...scanData };
    } catch (error) {
      console.error('Error saving scan:', error);
      // Fallback to local storage
      return this.saveScanHistoryLocal(scanData);
    }
  }

  /**
   * Save scan history to local storage
   */
  saveScanHistoryLocal(scanData) {
    try {
      let history = JSON.parse(localStorage.getItem('ecoinnovation_scans') || '[]');
      const scan = {
        id: generateUUID(),
        ...scanData,
        timestamp: new Date().toISOString()
      };
      history.push(scan);
      localStorage.setItem('ecoinnovation_scans', JSON.stringify(history));
      return scan;
    } catch (error) {
      console.error('Error saving scan locally:', error);
      return null;
    }
  }

  /**
   * Get scan history from Firestore
   */
  async getScanHistory(limit = 100) {
    try {
      if (!this.auth.currentUser) {
        return this.getScanHistoryLocal();
      }

      const userId = this.auth.currentUser.uid;
      const snapshot = await this.db.collection('users').doc(userId)
        .collection('scans')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting scans:', error);
      return this.getScanHistoryLocal();
    }
  }

  /**
   * Get scan history from local storage
   */
  getScanHistoryLocal() {
    try {
      const history = JSON.parse(localStorage.getItem('ecoinnovation_scans') || '[]');
      return history.reverse(); // Newest first
    } catch (error) {
      console.error('Error getting scans locally:', error);
      return [];
    }
  }

  /**
   * Delete scan from history
   */
  async deleteScan(scanId) {
    try {
      if (!this.auth.currentUser) {
        return this.deleteScanLocal(scanId);
      }

      const userId = this.auth.currentUser.uid;
      await this.db.collection('users').doc(userId)
        .collection('scans').doc(scanId).delete();

      return true;
    } catch (error) {
      console.error('Error deleting scan:', error);
      return this.deleteScanLocal(scanId);
    }
  }

  /**
   * Delete scan from local storage
   */
  deleteScanLocal(scanId) {
    try {
      let history = JSON.parse(localStorage.getItem('ecoinnovation_scans') || '[]');
      history = history.filter(scan => scan.id !== scanId);
      localStorage.setItem('ecoinnovation_scans', JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error deleting scan locally:', error);
      return false;
    }
  }

  /**
   * Clear all scan history
   */
  async clearScanHistory() {
    try {
      if (!this.auth.currentUser) {
        return this.clearScanHistoryLocal();
      }

      const userId = this.auth.currentUser.uid;
      const snapshot = await this.db.collection('users').doc(userId)
        .collection('scans').get();

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error clearing scans:', error);
      return this.clearScanHistoryLocal();
    }
  }

  /**
   * Clear scan history from local storage
   */
  clearScanHistoryLocal() {
    try {
      localStorage.removeItem('ecoinnovation_scans');
      return true;
    } catch (error) {
      console.error('Error clearing scans locally:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const scans = await this.getScanHistory(1000);

      const stats = {
        totalScans: scans.length,
        totalRecycled: scans.length, // Simplified
        co2Saved: (scans.length * 0.5).toFixed(1), // Estimate
        wasteByCategory: {}
      };

      // Count waste by category
      scans.forEach(scan => {
        if (scan.waste && scan.waste.category) {
          stats.wasteByCategory[scan.waste.category] =
            (stats.wasteByCategory[scan.waste.category] || 0) + 1;
        }
      });

      return stats;
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
   * Get user level based on stats
   */
  async getUserLevel() {
    try {
      const stats = await this.getUserStats();
      const scans = stats.totalScans;

      if (scans < 5) return 'Pemula';
      if (scans < 15) return 'Ramah Lingkungan';
      if (scans < 30) return 'Eco Warrior';
      if (scans < 50) return 'Green Champion';
      return 'Sustainability Master';
    } catch (error) {
      console.error('Error getting level:', error);
      return 'Pemula';
    }
  }

  /**
   * Save user profile
   */
  async saveUserProfile(profileData) {
    try {
      if (!this.auth.currentUser) {
        return false;
      }

      const userId = this.auth.currentUser.uid;
      await this.db.collection('users').doc(userId).set({
        ...profileData,
        updatedAt: new Date()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      if (!this.auth.currentUser) {
        return null;
      }

      const userId = this.auth.currentUser.uid;
      const doc = await this.db.collection('users').doc(userId).get();

      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Register user with email and password
   */
  async registerUser(email, password, displayName) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Save user profile
      await this.saveUserProfile({
        displayName,
        email,
        createdAt: new Date(),
        stats: {
          totalScans: 0
        }
      });

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logoutUser() {
    try {
      await this.auth.signOut();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Watch authentication state
   */
  authStateChanged(callback) {
    if (this.auth) {
      this.auth.onAuthStateChanged(callback);
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  async uploadImage(file, path) {
    try {
      if (!this.auth.currentUser) {
        return null;
      }

      const reference = this.storage.ref(path);
      const snapshot = await reference.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();

      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(path) {
    try {
      const reference = this.storage.ref(path);
      await reference.delete();
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Export scan history to JSON
   */
  async exportScanHistory() {
    try {
      const scans = await this.getScanHistory(1000);
      const stats = await this.getUserStats();

      return {
        exportDate: new Date().toISOString(),
        stats,
        scans
      };
    } catch (error) {
      console.error('Error exporting history:', error);
      return null;
    }
  }

  /**
   * Sync offline data to Firestore
   */
  async syncOfflineData() {
    try {
      if (!this.auth.currentUser) {
        return false;
      }

      const localScans = this.getScanHistoryLocal();
      const userId = this.auth.currentUser.uid;

      for (const scan of localScans) {
        // Check if scan already exists in Firestore
        const snapshot = await this.db.collection('users').doc(userId)
          .collection('scans')
          .where('timestamp', '==', new Date(scan.timestamp))
          .where('waste.name', '==', scan.waste.name)
          .get();

        if (snapshot.empty) {
          // Add to Firestore
          await this.db.collection('users').doc(userId)
            .collection('scans').add({
              ...scan,
              timestamp: new Date(scan.timestamp)
            });
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing offline data:', error);
      return false;
    }
  }
}

/**
 * Global database manager instance
 */
let dbManager = null;

/**
 * Initialize database manager
 */
function initializeDatabaseManager() {
  if (!dbManager) {
    dbManager = new DatabaseManager();
  }
  return dbManager;
}

/**
 * Make globally accessible
 */
window.dbManager = dbManager;
window.initializeDatabaseManager = initializeDatabaseManager;

console.log('Database module loaded successfully');
