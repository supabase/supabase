/**
 * UR Life Dashboard
 * Main application logic for campus assistant
 */

import {
  getCurrentUser,
  signOut,
  getProfile,
  updateProfile,
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  getTaskHistory,
  restoreTask,
  getContacts,
  addContact,
  deleteContact,
  getDegreeProgress,
  updateDegreeProgress,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  updatePassword
} from '../lib/supabase.js';

// ===================================================================
// GLOBAL STATE
// ===================================================================

let currentUser = null;
let currentProfile = null;
let tasks = [];
let taskHistory = [];
let contacts = [];
let degreeProgress = [];
let courses = [];

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 UR Life Dashboard Loaded - v2.0 (Supabase Edition)');

  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    console.log('❌ User not logged in, redirecting to login...');
    window.location.href = '/index.html';
    return;
  }

  currentUser = user;
  console.log('✅ User authenticated:', currentUser.id);

  // Initialize app
  await initializeApp();
});

async function initializeApp() {
  showLoading(true);

  try {
    // Load user profile
    await loadProfile();

    // Initialize event listeners
    initializeEventListeners();

    // Load initial data for home page
    await loadTasks();
    await loadTaskHistory();

    // Update UI
    updateHeaderUI();

  } catch (error) {
    console.error('❌ Initialization error:', error);
    alert('Failed to load application. Please try refreshing the page.');
  } finally {
    showLoading(false);
  }
}

// ===================================================================
// PROFILE MANAGEMENT
// ===================================================================

async function loadProfile() {
  const result = await getProfile(currentUser.id);

  if (result.success) {
    currentProfile = result.data;
    console.log('✅ Profile loaded:', currentProfile);
  } else {
    console.error('❌ Failed to load profile:', result.error);
    // Create default profile if it doesn't exist
    currentProfile = {
      id: currentUser.id,
      net_id: sessionStorage.getItem('currentUserNetId') || 'user',
      name: 'User',
      email: currentUser.email,
      major: 'Undeclared',
      year: 'Freshman',
      avatar: '🦊'
    };
  }
}

function updateHeaderUI() {
  document.getElementById('headerAvatar').textContent = currentProfile.avatar;
  document.getElementById('headerName').textContent = currentProfile.name;
}

async function handleEditProfile() {
  // Populate form
  document.getElementById('editName').value = currentProfile.name;
  document.getElementById('editEmail').value = currentProfile.email;
  document.getElementById('editMajor').value = currentProfile.major;
  document.getElementById('editYear').value = currentProfile.year;

  // Show modal
  showModal('editProfileModal');
}

async function saveProfile(formData) {
  showLoading(true);

  const updates = {
    name: formData.get('name'),
    email: formData.get('email'),
    major: formData.get('major'),
    year: formData.get('year')
  };

  const result = await updateProfile(currentUser.id, updates);

  if (result.success) {
    currentProfile = { ...currentProfile, ...updates };
    updateHeaderUI();
    updateProfilePageUI();
    hideModal('editProfileModal');
    showNotification('Profile updated successfully!');
  } else {
    alert('Failed to update profile: ' + result.error);
  }

  showLoading(false);
}

async function handleChangeAvatar() {
  showModal('avatarModal');
}

async function selectAvatar(emoji) {
  showLoading(true);

  const result = await updateProfile(currentUser.id, { avatar: emoji });

  if (result.success) {
    currentProfile.avatar = emoji;
    document.getElementById('headerAvatar').textContent = emoji;
    document.getElementById('profileAvatar').textContent = emoji;
    hideModal('avatarModal');
    showNotification('Avatar updated!');
  } else {
    alert('Failed to update avatar: ' + result.error);
  }

  showLoading(false);
}

function updateProfilePageUI() {
  document.getElementById('profileAvatar').textContent = currentProfile.avatar;
  document.getElementById('profileName').textContent = currentProfile.name;
  document.getElementById('profileNetId').textContent = currentProfile.net_id;
  document.getElementById('profileEmail').textContent = currentProfile.email;
  document.getElementById('profileMajor').textContent = currentProfile.major;
  document.getElementById('profileYear').textContent = currentProfile.year;
}

// ===================================================================
// TASKS MANAGEMENT
// ===================================================================

async function loadTasks() {
  const result = await getTasks(currentUser.id);

  if (result.success) {
    tasks = result.data;
    renderTasks();
  } else {
    console.error('Failed to load tasks:', result.error);
  }
}

function renderTasks() {
  const tasksList = document.getElementById('tasksList');

  if (tasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
    return;
  }

  tasksList.innerHTML = tasks.map(task => `
    <div class="task-item" data-task-id="${task.id}">
      <input
        type="checkbox"
        class="task-checkbox"
        ${task.completed ? 'checked' : ''}
        onchange="window.handleTaskComplete('${task.id}')"
      >
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-date">${formatDate(task.date)}</div>
      </div>
      <button class="task-delete" onclick="window.handleTaskDelete('${task.id}')">
        🗑️
      </button>
    </div>
  `).join('');
}

async function handleAddTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();

  if (!text) return;

  showLoading(true);

  const result = await addTask(currentUser.id, {
    text,
    date: new Date().toISOString().split('T')[0]
  });

  if (result.success) {
    tasks.push(result.data);
    renderTasks();
    input.value = '';
    showNotification('Task added!');
  } else {
    alert('Failed to add task: ' + result.error);
  }

  showLoading(false);
}

async function handleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  showLoading(true);

  const result = await completeTask(taskId, currentUser.id, task.text, task.date);

  if (result.success) {
    // Remove from tasks array
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();

    // Reload history
    await loadTaskHistory();

    showNotification('Task completed!');
  } else {
    alert('Failed to complete task: ' + result.error);
  }

  showLoading(false);
}

async function handleTaskDelete(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  showLoading(true);

  const result = await deleteTask(taskId);

  if (result.success) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
    showNotification('Task deleted!');
  } else {
    alert('Failed to delete task: ' + result.error);
  }

  showLoading(false);
}

// Expose functions to window for onclick handlers
window.handleTaskComplete = handleTaskComplete;
window.handleTaskDelete = handleTaskDelete;

// ===================================================================
// TASK HISTORY
// ===================================================================

async function loadTaskHistory() {
  const result = await getTaskHistory(currentUser.id);

  if (result.success) {
    taskHistory = result.data;
    updateHistoryUI();
  } else {
    console.error('Failed to load history:', result.error);
  }
}

function updateHistoryUI() {
  const historyCount = document.getElementById('historyCount');
  const historyContainer = document.getElementById('taskHistory');

  historyCount.textContent = taskHistory.length;

  if (taskHistory.length === 0) {
    historyContainer.innerHTML = '<div class="empty-state">No completed tasks yet.</div>';
    return;
  }

  historyContainer.innerHTML = taskHistory.map(item => `
    <div class="history-item" data-history-id="${item.id}">
      <div class="history-content">
        <div class="history-text">${escapeHtml(item.text)}</div>
        <div class="history-date">Completed ${formatDateTime(item.completed_at)}</div>
      </div>
      <button class="history-restore" onclick="window.handleRestoreTask('${item.id}')">
        ↩️ Restore
      </button>
    </div>
  `).join('');
}

async function handleRestoreTask(historyId) {
  const item = taskHistory.find(h => h.id === historyId);
  if (!item) return;

  showLoading(true);

  const result = await restoreTask(historyId, currentUser.id, item.text, item.original_date);

  if (result.success) {
    // Reload both tasks and history
    await loadTasks();
    await loadTaskHistory();
    showNotification('Task restored!');
  } else {
    alert('Failed to restore task: ' + result.error);
  }

  showLoading(false);
}

window.handleRestoreTask = handleRestoreTask;

function toggleHistory() {
  const historyContainer = document.getElementById('taskHistory');
  const toggle = document.getElementById('historyToggle');

  if (historyContainer.style.display === 'none') {
    historyContainer.style.display = 'block';
    toggle.classList.add('active');
  } else {
    historyContainer.style.display = 'none';
    toggle.classList.remove('active');
  }
}

// ===================================================================
// CONTACTS MANAGEMENT
// ===================================================================

async function loadContacts() {
  const result = await getContacts(currentUser.id);

  if (result.success) {
    contacts = result.data;
    renderContacts();
  } else {
    console.error('Failed to load contacts:', result.error);
  }
}

function renderContacts() {
  const mailingList = document.getElementById('mailingList');

  const categories = {
    professors: 'Professors',
    tas: 'Teaching Assistants',
    classmates: 'Classmates',
    friends: 'Friends',
    clubs: 'Clubs',
    research: 'Research Groups'
  };

  let html = '';

  for (const [key, title] of Object.entries(categories)) {
    const categoryContacts = contacts.filter(c => c.category === key);

    html += `
      <div class="contact-category">
        <div class="category-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="category-title">${title}</span>
          <span class="category-count">${categoryContacts.length}</span>
        </div>
        <div class="category-content">
          ${categoryContacts.length === 0
            ? '<div class="empty-state">No contacts in this category</div>'
            : categoryContacts.map(contact => `
                <div class="contact-item">
                  <div class="contact-info">
                    <div class="contact-name">${escapeHtml(contact.name)}</div>
                    <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
                  </div>
                  <button class="contact-delete" onclick="window.handleDeleteContact('${contact.id}')">
                    🗑️
                  </button>
                </div>
              `).join('')
          }
        </div>
      </div>
    `;
  }

  mailingList.innerHTML = html;
}

async function handleAddContact(formData) {
  showLoading(true);

  const contactData = {
    category: formData.get('category'),
    name: formData.get('name'),
    email: formData.get('email')
  };

  const result = await addContact(currentUser.id, contactData);

  if (result.success) {
    contacts.push(result.data);
    renderContacts();
    hideModal('addContactModal');
    showNotification('Contact added!');
  } else {
    alert('Failed to add contact: ' + result.error);
  }

  showLoading(false);
}

async function handleDeleteContact(contactId) {
  if (!confirm('Delete this contact?')) return;

  showLoading(true);

  const result = await deleteContact(contactId);

  if (result.success) {
    contacts = contacts.filter(c => c.id !== contactId);
    renderContacts();
    showNotification('Contact deleted!');
  } else {
    alert('Failed to delete contact: ' + result.error);
  }

  showLoading(false);
}

window.handleDeleteContact = handleDeleteContact;

// ===================================================================
// COURSES MANAGEMENT
// ===================================================================

async function loadCourses() {
  const result = await getCourses(currentUser.id);

  if (result.success) {
    courses = result.data;
    renderCourseCalendar();
  } else {
    console.error('Failed to load courses:', result.error);
  }
}

function renderCourseCalendar() {
  const calendar = document.getElementById('courseCalendar');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9 AM to 6 PM

  let html = '<div class="calendar-grid">';

  // Header row
  html += '<div class="calendar-header">';
  html += '<div class="calendar-cell time-header">Time</div>';
  days.forEach(day => {
    html += `<div class="calendar-cell day-header">${day}</div>`;
  });
  html += '</div>';

  // Time rows
  html += '<div class="calendar-body">';
  hours.forEach(hour => {
    html += '<div class="calendar-row">';
    html += `<div class="calendar-cell time-cell">${formatHour(hour)}</div>`;

    days.forEach(day => {
      const dayCourses = courses.filter(c => c.day === day);
      html += `<div class="calendar-cell course-cell" data-day="${day}" data-hour="${hour}">`;

      dayCourses.forEach(course => {
        const startHour = parseInt(course.start_time.split(':')[0]);
        const endHour = parseInt(course.end_time.split(':')[0]);

        if (startHour <= hour && hour < endHour) {
          if (startHour === hour) {
            // Only render at start hour
            const duration = endHour - startHour;
            html += `
              <div class="course-block" style="height: ${duration * 60}px; background-color: ${course.color || '#4a90e2'}">
                <div class="course-name">${escapeHtml(course.course_name)}</div>
                <div class="course-time">${formatTime(course.start_time)} - ${formatTime(course.end_time)}</div>
                <div class="course-location">${course.location || ''}</div>
                <button class="course-delete" onclick="window.handleDeleteCourse('${course.id}')">×</button>
              </div>
            `;
          }
        }
      });

      html += '</div>';
    });

    html += '</div>';
  });
  html += '</div>';

  html += '</div>';

  calendar.innerHTML = html;
}

async function handleAddCourse(formData) {
  showLoading(true);

  const courseData = {
    day: formData.get('day'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    course_name: formData.get('course_name'),
    location: formData.get('location'),
    color: '#4a90e2'
  };

  const result = await addCourse(currentUser.id, courseData);

  if (result.success) {
    courses.push(result.data);
    renderCourseCalendar();
    hideModal('addCourseModal');
    showNotification('Course added!');
  } else {
    alert('Failed to add course: ' + result.error);
  }

  showLoading(false);
}

async function handleDeleteCourse(courseId) {
  if (!confirm('Delete this course?')) return;

  showLoading(true);

  const result = await deleteCourse(courseId);

  if (result.success) {
    courses = courses.filter(c => c.id !== courseId);
    renderCourseCalendar();
    showNotification('Course deleted!');
  } else {
    alert('Failed to delete course: ' + result.error);
  }

  showLoading(false);
}

window.handleDeleteCourse = handleDeleteCourse;

// ===================================================================
// DEGREE PROGRESS
// ===================================================================

async function loadDegreeProgress() {
  const result = await getDegreeProgress(currentUser.id);

  if (result.success) {
    degreeProgress = result.data;
    renderDegreeProgress();
  } else {
    console.error('Failed to load degree progress:', result.error);
  }
}

function renderDegreeProgress() {
  const container = document.getElementById('degreeRequirements');

  const categories = {
    premajor: 'Pre-Major Requirements',
    core: 'Core Courses',
    math: 'Math Requirements',
    advanced: 'Advanced Courses',
    writing: 'Upper-Level Writing'
  };

  let html = '';
  let totalCompleted = 0;
  let totalCourses = degreeProgress.length;

  for (const [key, title] of Object.entries(categories)) {
    const categoryCourses = degreeProgress.filter(c => c.category === key);
    const completed = categoryCourses.filter(c => c.completed).length;
    const total = categoryCourses.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    totalCompleted += completed;

    html += `
      <div class="requirement-category">
        <div class="requirement-header">
          <h3>${title}</h3>
          <span class="requirement-progress">${completed}/${total} (${percentage}%)</span>
        </div>
        <div class="requirement-list">
          ${categoryCourses.map(course => `
            <div class="requirement-item">
              <input
                type="checkbox"
                id="course-${course.id}"
                ${course.completed ? 'checked' : ''}
                onchange="window.handleCourseCheck('${course.id}', '${course.category}', '${course.course_code}', this.checked)"
              >
              <label for="course-${course.id}">
                <span class="course-code">${course.course_code}</span>
                <span class="course-name">${course.course_name}</span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Update overall progress
  const overallPercentage = totalCourses > 0 ? Math.round((totalCompleted / totalCourses) * 100) : 0;
  document.getElementById('overallProgress').style.width = `${overallPercentage}%`;
  document.getElementById('overallProgressText').textContent = `${overallPercentage}%`;
}

async function handleCourseCheck(courseId, category, courseCode, completed) {
  const result = await updateDegreeProgress(currentUser.id, category, courseCode, completed);

  if (result.success) {
    // Update local state
    const course = degreeProgress.find(c => c.id === courseId);
    if (course) {
      course.completed = completed;
    }
    renderDegreeProgress();
  } else {
    alert('Failed to update progress: ' + result.error);
  }
}

window.handleCourseCheck = handleCourseCheck;

// ===================================================================
// NAVIGATION
// ===================================================================

function initializeEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateToPage(page);
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Tasks
  document.getElementById('addTaskBtn').addEventListener('click', handleAddTask);
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTask();
  });
  document.getElementById('historyToggle').addEventListener('click', toggleHistory);

  // Profile
  document.getElementById('editProfileBtn').addEventListener('click', handleEditProfile);
  document.getElementById('changeAvatarBtn').addEventListener('click', handleChangeAvatar);
  document.getElementById('changePasswordBtn').addEventListener('click', handleChangePassword);

  // Avatar selection
  document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', () => {
      const emoji = option.dataset.avatar;
      selectAvatar(emoji);
    });
  });

  // Forms
  document.getElementById('editProfileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    saveProfile(formData);
  });

  document.getElementById('addCourseBtn').addEventListener('click', () => {
    showModal('addCourseModal');
  });

  document.getElementById('addCourseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    handleAddCourse(formData);
  });

  document.getElementById('addContactBtn').addEventListener('click', () => {
    showModal('addContactModal');
  });

  document.getElementById('addContactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    handleAddContact(formData);
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) hideModal(modal.id);
    });
  });

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal.id);
      }
    });
  });
}

async function navigateToPage(page) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  // Show selected page
  const pageMap = {
    home: 'homePage',
    profile: 'profilePage',
    degree: 'degreePage'
  };

  const pageId = pageMap[page];
  if (pageId) {
    document.getElementById(pageId).classList.add('active');

    // Load data for page
    if (page === 'profile') {
      updateProfilePageUI();
      await loadCourses();
      await loadContacts();
    } else if (page === 'degree') {
      await loadDegreeProgress();
    }
  }
}

async function handleLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;

  showLoading(true);

  const result = await signOut();

  if (result.success) {
    sessionStorage.clear();
    window.location.href = '/index.html';
  } else {
    alert('Failed to sign out: ' + result.error);
    showLoading(false);
  }
}

async function handleChangePassword() {
  const newPassword = prompt('Enter new password:');
  if (!newPassword) return;

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long.');
    return;
  }

  showLoading(true);

  const result = await updatePassword(newPassword);

  if (result.success) {
    alert('Password updated successfully!');
  } else {
    alert('Failed to update password: ' + result.error);
  }

  showLoading(false);
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function showLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showNotification(message) {
  // Simple notification - could be enhanced with a toast library
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4a90e2;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatHour(hour) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
}
