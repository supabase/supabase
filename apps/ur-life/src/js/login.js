/**
 * Login Page JavaScript
 * Handles user authentication using Supabase
 */

import { signIn, getCurrentUser } from '../lib/supabase.js';

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 UR Life Login Page Loaded');

  // Check if user is already logged in
  const user = await getCurrentUser();
  if (user) {
    console.log('✅ User already logged in, redirecting...');
    window.location.href = '/dashboard.html';
    return;
  }

  initializeLoginPage();
});

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function initializeLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const demoCards = document.querySelectorAll('.demo-card');
  const signupLink = document.getElementById('signupLink');

  // Handle login form submission
  loginForm.addEventListener('submit', handleLogin);

  // Handle demo account clicks
  demoCards.forEach(card => {
    card.addEventListener('click', () => {
      const netId = card.dataset.netid;
      const password = card.dataset.password;

      document.getElementById('netId').value = netId;
      document.getElementById('password').value = password;

      // Add click animation
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 100);
    });
  });

  // Handle signup link
  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Sign up functionality coming soon! For now, please use a demo account.');
  });
}

// ===================================================================
// LOGIN HANDLER
// ===================================================================

async function handleLogin(e) {
  e.preventDefault();

  const netId = document.getElementById('netId').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  const loadingOverlay = document.getElementById('loadingOverlay');

  // Clear previous errors
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';

  // Validate inputs
  if (!netId || !password) {
    showError('Please enter both Net ID and password');
    return;
  }

  // Show loading
  loadingOverlay.style.display = 'flex';

  try {
    // Attempt login
    const result = await signIn(netId, password);

    if (result.success) {
      console.log('✅ Login successful!');
      console.log('User:', result.user);

      // Store user info in session
      sessionStorage.setItem('currentUserNetId', netId);
      sessionStorage.setItem('currentUserId', result.user.id);

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);

    } else {
      console.error('❌ Login failed:', result.error);
      showError('Invalid Net ID or password. Please try again or use a demo account.');
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    showError('An error occurred during login. Please try again.');
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';

  // Add shake animation to form
  const loginCard = document.querySelector('.login-card');
  loginCard.style.animation = 'shake 0.5s';
  setTimeout(() => {
    loginCard.style.animation = '';
  }, 500);
}

// ===================================================================
// KEYBOARD SHORTCUTS
// ===================================================================

document.addEventListener('keydown', (e) => {
  // Press Enter to submit
  if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
    const form = document.getElementById('loginForm');
    form.dispatchEvent(new Event('submit'));
  }
});
