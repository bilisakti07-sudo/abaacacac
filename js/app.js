/* ========================================
   Eco Innovation - Main App
   ======================================== */

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');

  // Initialize Firebase
  if (window.firebaseConfig) {
    console.log('Firebase configured');
  }

  // Initialize database manager
  const dbManager = initializeDatabaseManager();

  // Setup navigation
  setupNavigation();

  // Setup user menu
  setupUserMenu(dbManager);

  // Setup auth state listener
  setupAuthStateListener(dbManager);

  // Register service worker
  registerServiceWorker();

  // Check online status
  setupOnlineStatus();

  console.log('App initialized successfully');
});

/**
 * Setup navigation
 */
function setupNavigation() {
  const navbarToggle = document.getElementById('navbarToggle');
  const navbarMenu = document.getElementById('navbarMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navbarToggle) {
    navbarToggle.addEventListener('click', () => {
      navbarToggle.classList.toggle('active');
      navbarMenu?.classList.toggle('active');
    });
  }

  // Close menu when link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbarToggle?.classList.remove('active');
      navbarMenu?.classList.remove('active');
    });
  });

  // Setup bottom navigation for mobile
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      bottomNavItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Show bottom nav on mobile
  if (window.innerWidth < 768) {
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      bottomNav.classList.add('active');
    }
  }
}

/**
 * Setup user menu
 */
function setupUserMenu(dbManager) {
  const userBtnToggle = document.getElementById('userBtnToggle');
  const userDropdown = document.getElementById('userDropdown');
  const loginLink = document.getElementById('loginLink');
  const profileLink = document.getElementById('profileLink');
  const logoutLink = document.getElementById('logoutLink');

  if (userBtnToggle && userDropdown) {
    userBtnToggle.addEventListener('click', () => {
      userDropdown.classList.toggle('active');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-user')) {
      userDropdown?.classList.remove('active');
    }
  });

  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginModal(dbManager);
    });
  }

  if (profileLink) {
    profileLink.addEventListener('click', (e) => {
      e.preventDefault();
      showProfileModal(dbManager);
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await dbManager.logoutUser();
      location.reload();
    });
  }
}

/**
 * Setup auth state listener
 */
function setupAuthStateListener(dbManager) {
  dbManager.authStateChanged((user) => {
    const userBtn = document.getElementById('userBtnToggle');
    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');

    if (user) {
      // User is logged in
      if (userBtn) userBtn.textContent = `👤 ${user.displayName || user.email}`;
      loginLink?.style.preventDefault !== false && (loginLink.style.display = 'none');
      profileLink?.style.preventDefault !== false && (profileLink.style.display = 'block');
      logoutLink?.style.preventDefault !== false && (logoutLink.style.display = 'block');
    } else {
      // User is logged out
      if (userBtn) userBtn.textContent = '👤 Akun';
      loginLink?.style.preventDefault !== false && (loginLink.style.display = 'block');
      profileLink?.style.preventDefault !== false && (profileLink.style.display = 'none');
      logoutLink?.style.preventDefault !== false && (logoutLink.style.display = 'none');
    }
  });
}

/**
 * Show login modal
 */
function showLoginModal(dbManager) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      <h3>Login / Register</h3>

      <div class="tabs" style="margin: 1.5rem 0;">
        <button class="tab-button active" data-tab="login">Login</button>
        <button class="tab-button" data-tab="register">Register</button>
      </div>

      <div id="login-tab" class="tab-content active">
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="email" id="loginEmail" placeholder="Email" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <input type="password" id="loginPassword" placeholder="Password" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <button type="submit" class="btn btn-primary">Login</button>
        </form>
      </div>

      <div id="register-tab" class="tab-content">
        <form id="registerForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="text" id="registerName" placeholder="Nama Lengkap" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <input type="email" id="registerEmail" placeholder="Email" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <input type="password" id="registerPassword" placeholder="Password" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <input type="password" id="registerPassword2" placeholder="Ulang Password" required style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem;">
          <button type="submit" class="btn btn-primary">Register</button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup tab switching
  const tabButtons = modal.querySelectorAll('.tab-button');
  const tabContents = modal.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Setup form submissions
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      showLoading('Melakukan login...');
      await dbManager.loginUser(email, password);
      hideLoading();
      showSuccess('Login berhasil!');
      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (error) {
      hideLoading();
      showError('Login gagal: ' + error.message);
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const password2 = document.getElementById('registerPassword2').value;

    if (password !== password2) {
      showError('Password tidak sesuai');
      return;
    }

    try {
      showLoading('Mendaftarkan akun...');
      await dbManager.registerUser(email, password, name);
      hideLoading();
      showSuccess('Registrasi berhasil! Silakan login');
      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (error) {
      hideLoading();
      showError('Registrasi gagal: ' + error.message);
    }
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Show profile modal
 */
function showProfileModal(dbManager) {
  const user = dbManager.getCurrentUser();
  if (!user) {
    showError('Silakan login terlebih dahulu');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      <h3>Profil Pengguna</h3>
      <div style="padding: 1rem 0;">
        <p><strong>Nama:</strong> ${user.displayName || 'Tidak tersedia'}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Tutup</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Register service worker
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('js/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }
}

/**
 * Setup online status
 */
function setupOnlineStatus() {
  window.addEventListener('online', () => {
    console.log('App is online');
    showSuccess('Aplikasi terhubung internet', 2000);
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    showError('Aplikasi offline - beberapa fitur mungkin terbatas', 5000);
  });

  // Check initial status
  if (!navigator.onLine) {
    showError('Aplikasi offline', 5000);
  }
}

/**
 * Handle window resize for responsive design
 */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Handle responsive design changes
    const bottomNav = document.querySelector('.bottom-nav');
    if (window.innerWidth < 768) {
      bottomNav?.classList.add('active');
    } else {
      bottomNav?.classList.remove('active');
    }
  }, 250);
});

/**
 * Setup detail modal closes
 */
document.addEventListener('click', (e) => {
  const detailModal = document.getElementById('detailModal');
  const locationModal = document.getElementById('locationModal');

  if (e.target === detailModal) {
    detailModal.style.display = 'none';
  }

  if (e.target === locationModal) {
    locationModal.style.display = 'none';
  }
});

/**
 * Add CSS styling for buttons and forms
 */
const style = document.createElement('style');
style.textContent = `
  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1.25rem;
    transition: transform 0.2s ease;
  }

  .btn-icon:hover {
    transform: scale(1.2);
  }

  .history-item {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    animation: fadeInUp 0.4s ease-out;
  }

  .history-item-image {
    width: 80px;
    height: 80px;
    border-radius: 0.5rem;
    overflow: hidden;
    background: #f3f4f6;
  }

  .history-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .history-item-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .history-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .history-item-title {
    margin: 0;
  }

  .history-item-confidence {
    background: #dbeafe;
    color: #0c4a6e;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .history-item-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .history-item-category {
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
  }

  .history-item-date {
    color: #6b7280;
  }

  .history-item-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .location-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .location-item:hover {
    border-color: #10b981;
    background: #f0fdf4;
    transform: translateY(-2px);
  }

  .location-number {
    min-width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #10b981;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .location-info {
    flex: 1;
  }

  .location-info h4 {
    margin: 0 0 0.25rem 0;
    color: #111827;
  }

  .location-info p {
    margin: 0.25rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .location-type {
    color: #10b981;
    font-weight: 600;
  }

  input,
  select,
  textarea {
    font-family: var(--font-sans);
  }
`;

document.head.appendChild(style);

console.log('App module loaded successfully');
