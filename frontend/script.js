// Test if script is loading
console.log('Script loaded successfully!');

// Define API base URL - dynamically get hostname and use port 5000 for backend
function getApiBaseUrl() {
  // Get the current hostname (IP address when accessed from network)
  const hostname = window.location.hostname;
  // Use port 5000 for the backend API
  return `http://${hostname}:5000`;
}
const API_BASE_URL = getApiBaseUrl();

// Error and success message functions
function showFormError(form, message) {
  let errorDiv = form.querySelector('.form-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    form.insertBefore(errorDiv, form.firstChild.nextSibling);
  }
  errorDiv.textContent = message;
}

function showFormSuccess(form, message) {
  let successDiv = form.querySelector('.form-success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    form.insertBefore(successDiv, form.firstChild.nextSibling);
  }
  successDiv.textContent = message;
  // Remove error if present
  let errorDiv = form.querySelector('.form-error');
  if (errorDiv) errorDiv.textContent = '';
}

// Test if script is loading
console.log('Script loaded successfully!');

// Utility functions for showing form messages
function showFormError(form, message) {
  console.log('Showing error:', message);
  let errorDiv = form.querySelector('.form-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    form.insertBefore(errorDiv, form.firstChild);
  }
  errorDiv.textContent = message;
}

function showFormSuccess(form, message) {
  console.log('Showing success:', message);
  let successDiv = form.querySelector('.form-success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    form.insertBefore(successDiv, form.firstChild);
  }
  successDiv.textContent = message;
  // Remove error if present
  let errorDiv = form.querySelector('.form-error');
  if (errorDiv) errorDiv.textContent = '';
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // Initialize login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    console.log('Login form found, attaching event listener');
    loginForm.addEventListener('submit', handleLogin);
  } else {
    console.log('Login form not found');
  }

  // Hamburger button: sidebar/minibar toggle (only for student dashboard)
  const sidebarBtn = document.getElementById('sidebarToggle');
  if (sidebarBtn && document.getElementById('studentName')) { // Only on student dashboard
    sidebarBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }
  // Quick action buttons
  ['upload','search','settings'].forEach(section => {
    const btn = document.querySelector(`.quick-action-btn[onclick="switchSection('${section}')"]`);
    if (btn) btn.addEventListener('click', () => switchSection(section));
  });
  // Sidebar nav links (Upload, Search, Settings)
  document.querySelectorAll('.modern-nav-link[data-section]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      switchSection(section);
    });
  });

  // Admin: Change Password form handling
  const adminChangePasswordForm = document.getElementById('adminChangePasswordForm');
  if (adminChangePasswordForm) {
    adminChangePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      // Grab fields
      const currentPassword = document.getElementById('adminCurrentPassword').value.trim();
      const newPassword = document.getElementById('adminNewPassword').value.trim();
      const confirmNewPassword = document.getElementById('adminConfirmNewPassword').value.trim();
      const errorDiv = adminChangePasswordForm.querySelector('.form-error');
      const successDiv = adminChangePasswordForm.querySelector('.form-success');
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      // Basic validation
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        errorDiv.textContent = 'Please fill in all fields.';
        errorDiv.style.display = 'block';
        return;
      }
      if (newPassword.length < 6) {
        errorDiv.textContent = 'New password must be at least 6 characters.';
        errorDiv.style.display = 'block';
        return;
      }
      if (newPassword !== confirmNewPassword) {
        errorDiv.textContent = 'New passwords do not match.';
        errorDiv.style.display = 'block';
        return;
      }
      // API call
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update password');
        }
        successDiv.textContent = 'Password updated successfully.';
        successDiv.style.display = 'block';
        // Optionally reset the form
        adminChangePasswordForm.reset();
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  // Open Change Password Modal button
  const openPwdBtn = document.getElementById('openChangePasswordModalBtn');
  if (openPwdBtn) openPwdBtn.addEventListener('click', openChangePasswordModal);

  attachPasswordToggleListeners();
  // Add to modals when opened too
  if (openPwdBtn) {
    openPwdBtn.addEventListener('click', function(){
      openChangePasswordModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('changePasswordModal')), 50);
    });
  }
  const openCreateAdminBtn = document.querySelector('[onclick="openCreateAdminModal()"]');
  if (openCreateAdminBtn) {
    openCreateAdminBtn.addEventListener('click', function(){
      openCreateAdminModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('createAdminModal')), 50);
    });
  }
});

// Section switching logic for student dashboard
function switchSection(sectionName) {
  // Update nav
  document.querySelectorAll('.modern-nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const navLink = document.querySelector(`[data-section="${sectionName}"]`);
  if (navLink) navLink.classList.add('active');
  // Update sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  const targetSection = document.getElementById(sectionName);
  if (targetSection) targetSection.classList.add('active');
}

// Login form handler function
async function handleLogin(e) {
  e.preventDefault();
  console.log('Login form submitted');
  
  const form = e.target;
  const loginId = document.getElementById('loginId');
  const password = document.getElementById('loginPassword');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (!loginId.value || !password.value) {
    showFormError(form, 'Please fill in all fields');
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  
    try {
      console.log('Sending login request...');
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loginId: loginId.value,
          password: password.value
        })
      });    const data = await response.json();
    console.log('Login response:', data);
    
    if (response.ok) {
      showFormSuccess(form, 'Login successful!');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login response:', data);
      
      // Redirect based on role
      if (data.user && data.user.role) {
        if (data.user.role === 'student') {
          window.location.href = 'dashboard.html';
        } else if (data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          showFormError(form, 'Invalid user role');
          console.error('Invalid role:', data.user.role);
        }
      } else {
        showFormError(form, 'Invalid response from server');
        console.error('Invalid server response:', data);
      }
    } else {
      showFormError(form, data.message || 'Login failed');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  } catch (error) {
    console.error('Login error:', error);
    showFormError(form, 'Could not connect to server');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

// Registration form toggle logic
const registerForm = document.getElementById('registerForm');
console.log('Register form found:', !!registerForm);
if (registerForm) {
  const studentFields = document.getElementById('studentFields');
  const adminFields = document.getElementById('adminFields');
  const userTypeRadios = document.getElementsByName('userType');

  // Helper to set required attributes only on visible fields
  function setRequiredFields(role) {
    // Student fields
    ['studentFirstName','studentLastName','studentId','studentDepartment','studentPassword','studentConfirmPassword'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = (role === 'student');
    });
    // Admin fields
    ['adminFirstName','adminLastName','adminUsername','adminPassword','adminConfirmPassword','adminSecretKey'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = (role === 'admin');
    });
  }

  userTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'student' && radio.checked) {
        studentFields.style.display = '';
        adminFields.style.display = 'none';
        setRequiredFields('student');
      } else if (radio.value === 'admin' && radio.checked) {
        studentFields.style.display = 'none';
        adminFields.style.display = '';
        setRequiredFields('admin');
      }
    });
  });
  // Set initial required fields
  setRequiredFields(document.querySelector('input[name="userType"]:checked').value);

  console.log('Adding submit event listener to register form');
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Register form submitted!');
    let valid = true;
    let errorMsg = '';
    let payload = {};
    let role = document.querySelector('input[name="userType"]:checked').value;
    console.log('User role:', role);
    // Student validation
    if (role === 'student') {
      const password = document.getElementById('studentPassword').value;
      const confirmPassword = document.getElementById('studentConfirmPassword').value;
      if (password !== confirmPassword) {
        valid = false;
        errorMsg = 'Passwords do not match.';
      }
      // Check required fields
      ['studentFirstName','studentLastName','studentId','studentDepartment','studentPassword','studentConfirmPassword'].forEach(id => {
        if (!document.getElementById(id).value) valid = false;
      });
      // Check terms checkbox
      const studentTermsCheckbox = document.getElementById('studentTermsCheckbox');
      console.log('Student terms checkbox:', studentTermsCheckbox, 'Checked:', studentTermsCheckbox ? studentTermsCheckbox.checked : 'not found');
      if (!studentTermsCheckbox || !studentTermsCheckbox.checked) {
        valid = false;
        errorMsg = 'You must agree to the Terms and Conditions to register.';
      }
      payload = {
        role: 'student',
        firstName: document.getElementById('studentFirstName').value,
        lastName: document.getElementById('studentLastName').value,
        schoolId: document.getElementById('studentId').value,
        department: document.getElementById('studentDepartment').value,
        password: document.getElementById('studentPassword').value
      };
    } else {
      // Admin validation
      const password = document.getElementById('adminPassword').value;
      const confirmPassword = document.getElementById('adminPassword2').value;
      if (password !== confirmPassword) {
        valid = false;
        errorMsg = 'Passwords do not match.';
      }
      // Check required fields (favoriteColor is now optional)
      ['adminFirstName','adminLastName','adminUsername','adminPassword','adminConfirmPassword','adminSecretKey'].forEach(id => {
        if (!document.getElementById(id).value) valid = false;
      });
      // Check terms checkbox
      const adminTermsCheckbox = document.getElementById('adminTermsCheckbox');
      if (!adminTermsCheckbox || !adminTermsCheckbox.checked) {
        valid = false;
        errorMsg = 'You must agree to the Terms and Conditions to register.';
      }
      const favoriteColorValue = document.getElementById('adminFavoriteColor').value;
      payload = {
        role: 'admin',
        firstName: document.getElementById('adminFirstName').value,
        lastName: document.getElementById('adminLastName').value,
        username: document.getElementById('adminUsername').value,
        password: document.getElementById('adminPassword').value,
        secretKey: document.getElementById('adminSecretKey').value,
        favoriteColor: favoriteColorValue || undefined
      };
    }
    console.log('Form validation result:', valid, 'Error message:', errorMsg);
    if (!valid) {
      console.log('Form validation failed:', errorMsg || 'Please fill all required fields.');
      showFormError(registerForm, errorMsg || 'Please fill all required fields.');
      return;
    }
    console.log('Form validation passed, proceeding with registration...');
    // Send registration data to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (role === 'student') {
          registerForm.style.display = 'none';
          const card = document.createElement('div');
          card.style.background = '#fff';
          card.style.borderRadius = '14px';
          card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)';
          card.style.padding = '32px 28px 20px 28px';
          card.style.margin = '40px auto 0 auto';
          card.style.maxWidth = '400px';
          card.style.textAlign = 'center';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.innerHTML = `
            <div style="font-size:1.18rem;font-weight:600;margin-bottom:14px;">Your registration request is waiting for admin approval.</div>
            <div style="margin-bottom:16px;">You may approach <strong>Ms. Kathline Ventura</strong> in room 103 to expedite approval.</div>
            <a href="index.html" class="btn btn-outline-primary" style="margin-top:4px;padding:10px 20px;font-size:1rem;"><i class="fas fa-sign-in-alt"></i> Back to Login</a>
          `;
          registerForm.parentNode.appendChild(card);
        } else {
          // Admin registration - show QR code if available
          if (data.qrCode) {
            registerForm.style.display = 'none';
            showQRCodeModal(data.qrCode, data.secret, payload.username);
            // Also show a success message
            const card = document.createElement('div');
            card.style.background = '#fff';
            card.style.borderRadius = '14px';
            card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)';
            card.style.padding = '32px 28px 20px 28px';
            card.style.margin = '20px auto 0 auto';
            card.style.maxWidth = '400px';
            card.style.textAlign = 'center';
            card.innerHTML = `
              <div style="font-size:1.18rem;font-weight:600;margin-bottom:14px;color:#28a745;">
                <i class="fas fa-check-circle"></i> ${data.message || 'Registration successful!'}
              </div>
              <div style="margin-bottom:16px;color:#666;">Please scan the QR code shown above with Google Authenticator.</div>
              <a href="index.html" class="btn btn-outline-primary" style="margin-top:4px;padding:10px 20px;font-size:1rem;"><i class="fas fa-sign-in-alt"></i> Back to Login</a>
            `;
            registerForm.parentNode.appendChild(card);
          } else {
            showFormSuccess(registerForm, data.message || 'Registration successful!');
          }
        }
        registerForm.reset();
      } else {
        showFormError(registerForm, data.message || 'Registration failed.');
      }
    } catch (err) {
      showFormError(registerForm, 'Could not connect to server.');
    }
  });
}

// Login form validation and backend connection
const loginForm = document.getElementById('loginForm');
console.log('Login form found:', !!loginForm);
if (loginForm) {
  console.log('Adding submit event listener to login form');
  loginForm.addEventListener('submit', async function(e) {
    console.log('Login form submitted');
    e.preventDefault();
    let valid = true;
    ['loginId','loginPassword'].forEach(id => {
      if (!document.getElementById(id).value) valid = false;
    });
    if (!valid) {
      showFormError(loginForm, 'Please fill all required fields.');
      return;
    }
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // Prepare login payload
    const payload = {
      loginId: document.getElementById('loginId').value,
      password: document.getElementById('loginPassword').value
    };
    
    // Send login data to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Login response:', data);
      
      if (res.ok) {
        showFormSuccess(loginForm, 'Login successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        showFormError(loginForm, data.message || 'Login failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    } catch (err) {
      console.error('Login error:', err);
      showFormError(loginForm, 'Could not connect to server.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Admin dashboard logic
const adminNav = document.querySelectorAll('.nav-link');
const adminSections = document.querySelectorAll('.admin-section');
const logoutBtn = document.getElementById('logoutBtn');

if (adminNav.length > 0) {
  adminNav.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').substring(1);
      adminSections.forEach(section => {
        section.style.display = section.id === target ? 'block' : 'none';
      });
      adminNav.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}

// User Management Functions
let allUsers = [];
let currentAccountType = 'students';
let currentStudentFilter = 'all';

async function loadUsers() {
  console.log('loadUsers() called');
  const studentsLoadingDiv = document.getElementById('studentsLoading');
  const studentsErrorDiv = document.getElementById('studentsError');
  const studentsTableDiv = document.getElementById('studentsTable');
  const adminsLoadingDiv = document.getElementById('adminsLoading');
  const adminsErrorDiv = document.getElementById('adminsError');
  const adminsTableDiv = document.getElementById('adminsTable');
  
  console.log('Loading elements found:', {
    studentsLoadingDiv: !!studentsLoadingDiv,
    studentsErrorDiv: !!studentsErrorDiv,
    studentsTableDiv: !!studentsTableDiv,
    adminsLoadingDiv: !!adminsLoadingDiv,
    adminsErrorDiv: !!adminsErrorDiv,
    adminsTableDiv: !!adminsTableDiv
  });
  
  // Show loading state for both sections
  studentsLoadingDiv.style.display = 'block';
  studentsErrorDiv.style.display = 'none';
  studentsTableDiv.style.display = 'none';
  adminsLoadingDiv.style.display = 'block';
  adminsErrorDiv.style.display = 'none';
  adminsTableDiv.style.display = 'none';
  
  try {
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);
    
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    allUsers = await response.json();
    console.log('Users loaded:', allUsers.length, 'users');
    displayStudents();
    displayAdmins();
    
    // Show tables
    studentsLoadingDiv.style.display = 'none';
    studentsTableDiv.style.display = 'block';
    adminsLoadingDiv.style.display = 'none';
    adminsTableDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading users:', error);
    studentsLoadingDiv.style.display = 'none';
    studentsErrorDiv.style.display = 'block';
    adminsLoadingDiv.style.display = 'none';
    adminsErrorDiv.style.display = 'block';
  }
}

function displayStudents() {
  console.log('displayStudents() called');
  const tableBody = document.getElementById('studentsTableBody');
  const students = allUsers.filter(user => user.role === 'student');
  
  console.log('Total students found:', students.length);
  
  // Filter students based on current filter
  let filteredStudents = students;
  if (currentStudentFilter === 'pending') {
    filteredStudents = students.filter(user => user.status === 'pending');
  } else if (currentStudentFilter === 'approved') {
    filteredStudents = students.filter(user => user.status === 'approved');
  } else if (currentStudentFilter === 'rejected') {
    filteredStudents = students.filter(user => user.status === 'rejected');
  }
  
  console.log('Filtered students:', filteredStudents.length);
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add student rows
  filteredStudents.forEach(user => {
    const row = document.createElement('tr');
    
    // Determine action buttons based on status
    let actionButtons = '';
    if (user.status === 'pending') {
      actionButtons = `
        <button class="action-btn approve-btn" onclick="approveUser('${user._id}', 'approved')">
          Approve
        </button>
        <button class="action-btn reject-btn" onclick="approveUser('${user._id}', 'rejected')">
          Reject
        </button>
      `;
    } else if (user.status === 'rejected') {
      actionButtons = `
        <button class="action-btn approve-btn" onclick="approveUser('${user._id}', 'approved')">
          Approve
        </button>
      `;
    }
    // No reject button for approved students - they stay approved
    
    actionButtons += `
      <button class="action-btn delete-btn" onclick="deleteUser('${user._id}')">
        Delete
      </button>
    `;
    
    row.innerHTML = `
      <td>${user._id.substring(0, 8)}...</td>
      <td>${user.firstName}</td>
      <td>${user.lastName}</td>
      <td>${user.schoolId || '-'}</td>
      <td>${user.department || '-'}</td>
      <td><span class="status-badge status-${user.status}">${user.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
}

function displayAdmins() {
  console.log('displayAdmins() called');
  const tableBody = document.getElementById('adminsTableBody');
  const admins = allUsers.filter(user => user.role === 'admin');
  
  console.log('Total admins found:', admins.length);
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add admin rows
  admins.forEach(user => {
    const row = document.createElement('tr');
    
    const actionButtons = `
      <button class="action-btn delete-btn" onclick="deleteUser('${user._id}')">
        Delete
      </button>
    `;
    
    row.innerHTML = `
      <td>${user._id.substring(0, 8)}...</td>
      <td>${user.firstName}</td>
      <td>${user.lastName}</td>
      <td>${user.username || '-'}</td>
      <td><span class="status-badge status-${user.status}">${user.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
}

function showAccountType(type) {
  currentAccountType = type;
  
  // Update active tab - find the correct tab button and activate it
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Find and activate the correct tab button
  const targetTab = document.querySelector(`button[onclick="showAccountType('${type}')"]`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // Show/hide sections
  const studentsSection = document.getElementById('studentsSection');
  const adminsSection = document.getElementById('adminsSection');
  const resetRequestsSection = document.getElementById('resetRequestsSection');
  
  if (type === 'students') {
    if (studentsSection) studentsSection.style.display = 'block';
    if (adminsSection) adminsSection.style.display = 'none';
    if (resetRequestsSection) resetRequestsSection.style.display = 'none';
    // Load students data
    loadUsers();
  } else if (type === 'admins') {
    if (studentsSection) studentsSection.style.display = 'none';
    if (adminsSection) adminsSection.style.display = 'block';
    if (resetRequestsSection) resetRequestsSection.style.display = 'none';
    // Load admins data
    loadUsers();
  } else if (type === 'resetRequests') {
    if (studentsSection) studentsSection.style.display = 'none';
    if (adminsSection) adminsSection.style.display = 'none';
    if (resetRequestsSection) resetRequestsSection.style.display = 'block';
    loadResetRequests();
  }
}

function filterStudents(filter) {
  currentStudentFilter = filter;
  
  // Update active tab
  document.querySelectorAll('#studentsSection .filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Display filtered students
  displayStudents();
}

function showCreateAdminForm() {
  // Scroll to the admin creation form in settings
  document.querySelector('a[href="#settings"]').click();
  setTimeout(() => {
    document.getElementById('adminCreateForm').scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

async function approveUser(userId, status) {
  const action = status === 'approved' ? 'approve' : 'reject';
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} user`);
    }
    
    // Reload users table
    loadUsers();
    
  } catch (error) {
    console.error(`Error ${action}ing user:`, error);
    alert(`Failed to ${action} user. Please try again.`);
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    // Reload users table
    loadUsers();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user. Please try again.');
  }
}

// Research Management Functions
async function loadResearch() {
  const loadingDiv = document.getElementById('researchLoading');
  const errorDiv = document.getElementById('researchError');
  const tableDiv = document.getElementById('researchTable');
  const tableBody = document.getElementById('researchTableBody');
  
  // Show loading state
  loadingDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  tableDiv.style.display = 'none';
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch research papers');
    }
    
    const research = await response.json();
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add research rows
    research.forEach(paper => {
      const row = document.createElement('tr');
      const viewPdfLink = paper.pdfFilePath ? 
        `<a href="${API_BASE_URL}/api/research/${paper._id}/pdf" target="_blank" class="view-pdf-link">View PDF</a>` :
        '<span class="no-pdf">No PDF</span>';

      row.innerHTML = `
        <td>${paper._id.substring(0, 8)}...</td>
        <td title="${paper.title}">${paper.title.length > 30 ? paper.title.substring(0, 30) + '...' : paper.title}</td>
        <td title="${paper.authors.join(', ')}">${paper.authors.join(', ').length > 20 ? paper.authors.join(', ').substring(0, 20) + '...' : paper.authors.join(', ')}</td>
        <td>${paper.department}</td>
        <td>${paper.year}</td>
        <td><span class="status-badge status-${paper.status}">${paper.status}</span></td>
        <td>
          ${viewPdfLink}
          ${paper.status === 'pending' ? `
            <button class="action-btn approve-btn" onclick="approveResearch('${paper._id}', 'approved')">Approve</button>
            <button class="action-btn reject-btn" onclick="approveResearch('${paper._id}', 'rejected')">Reject</button>
          ` : ''}
          ${paper.status === 'rejected' ? `
            <button class="action-btn approve-btn" onclick="approveResearch('${paper._id}', 'approved')">Approve</button>
          ` : ''}
          <button class="action-btn archive-btn" onclick="archiveResearch('${paper._id}')">Archive</button>
          <button class="action-btn delete-btn" onclick="deleteResearch('${paper._id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // Show table
    loadingDiv.style.display = 'none';
    tableDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading research:', error);
    loadingDiv.style.display = 'none';
    errorDiv.style.display = 'block';
  }
}

async function uploadResearch(formData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload research');
    }
    
    const result = await response.json();
    alert('Research uploaded successfully!');
    
    // Reset form
    document.getElementById('researchUploadForm').reset();
    
    // Reload research table and switch to Search tab to view it
    loadResearch();
    const searchTab = document.querySelector('a[href="#search"]');
    if (searchTab) {
      searchTab.click();
      // Pre-fill keyword with the uploaded title for quick view
      const title = result.research?.title || '';
      const keywordInput = document.getElementById('searchKeyword');
      if (keywordInput && title) {
        keywordInput.value = title;
        performSearch();
      }
    }
    
  } catch (error) {
    console.error('Error uploading research:', error);
    alert('Failed to upload research: ' + error.message);
  }
}

async function approveResearch(researchId, status) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research/${researchId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update research status');
    }
    
    // Reload research table
    loadResearch();
    
  } catch (error) {
    console.error('Error updating research status:', error);
    alert('Failed to update research status. Please try again.');
  }
}

async function deleteResearch(researchId) {
  if (!confirm('Are you sure you want to delete this research paper?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research/${researchId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete research');
    }
    
    // Reload research table
    loadResearch();
    
  } catch (error) {
    console.error('Error deleting research:', error);
    alert('Failed to delete research. Please try again.');
  }
}


// Research form submission
const researchForm = document.getElementById('researchUploadForm');
if (researchForm) {
  // If the wizard form exists on this page, avoid binding the legacy upload form
  if (document.getElementById('uploadWizardForm')) {
    // Skip attaching the legacy handler to prevent double submissions
  } else {
  researchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = researchForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    
    try {
      // Resolve elements once and validate existence
      const titleEl = document.getElementById('researchTitle');
      const abstractEl = document.getElementById('researchAbstract');
      const authorsHiddenEl = document.getElementById('researchAuthors');
      const adviserEl = document.getElementById('researchAdviser');
      const departmentEl = document.getElementById('researchDepartment');
      const yearEl = document.getElementById('researchYear');
      const keywordsHiddenEl = document.getElementById('researchKeywords');
      const fileInput = document.getElementById('researchPdf');

      const missing = [];
      if (!titleEl) missing.push('Title');
      // Abstract removed; ignore if not present
      if (!authorsHiddenEl) missing.push('Authors');
      if (!adviserEl) missing.push('Adviser');
      if (!departmentEl) missing.push('Department');
      if (!yearEl) missing.push('Year');
      if (!keywordsHiddenEl) missing.push('Keywords');
      if (!fileInput) missing.push('PDF File');
      
      if (missing.length) {
        throw new Error('Missing form fields: ' + missing.join(', '));
      }
      
      // Validate file type
      if (!fileInput.files || !fileInput.files[0]) {
        throw new Error('Please select a PDF file.');
      }
      if (fileInput.files[0].type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed.');
      }
      
      // Create FormData safely
      const formData = new FormData();
      formData.append('title', titleEl.value);
      if (abstractEl) formData.append('abstract', abstractEl.value);
      formData.append('authors', authorsHiddenEl.value || '');
      formData.append('adviser', adviserEl.value);
      formData.append('department', departmentEl.value);
      formData.append('year', yearEl.value);
      formData.append('keywords', keywordsHiddenEl.value || '');
      // Align with backend multer: upload.single('file')
      formData.append('file', fileInput.files[0]);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to upload research.');
      }

      const response = await fetch(`${API_BASE_URL}/api/research`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload research');
      }

      const result = await response.json();
      showFormSuccess(researchForm, 'Research uploaded successfully!');
      researchForm.reset();
      loadResearch(); // Reload the research table
    } catch (error) {
      console.error('Upload error:', error);
      showFormError(researchForm, error.message || 'Failed to upload research. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
  }
}

// Admin Creation Functions
async function createAdmin(formData) {
  try {
    const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        password: formData.password,
        favoriteColor: formData.favoriteColor || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create admin');
    }

    const result = await response.json();
    
    // Show QR code modal if QR code is returned
    if (result.qrCode) {
      showQRCodeModal(result.qrCode, result.secret, formData.username);
    } else {
      alert('Admin created successfully!');
    }
    
    document.getElementById('createAdminForm')?.reset();
    loadUsers && loadUsers(); // Only call loadUsers if defined (refresh admin table)
  } catch (error) {
    console.error('Error creating admin:', error);
    alert('Failed to create admin: ' + error.message);
  }
}

/**
 * Show QR code modal for Google Authenticator setup
 */
function showQRCodeModal(qrCodeDataUrl, secret, username) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'qrCodeModalOverlay';
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;';
  
  // Create modal content
  const modal = document.createElement('div');
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const modalBg = isDarkMode ? 'var(--bg-secondary)' : 'white';
  const modalText = isDarkMode ? 'var(--text-primary)' : '#333';
  modal.style.cssText = `background: ${modalBg}; padding: 2rem; border-radius: 12px; max-width: 900px; width: 95%; max-height: 95vh; overflow-y: auto; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); position: relative; margin: auto; color: ${modalText};`;
  
  modal.innerHTML = `
    <h2 style="margin-bottom: 1rem; color: #333; font-size: 1.5rem;"><i class="fas fa-qrcode"></i> Google Authenticator Setup</h2>
    
    <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 1rem; margin-bottom: 1.5rem; text-align: left; border-radius: 4px;">
      <p style="margin: 0; color: #1565c0; font-weight: 600; font-size: 0.95rem;"><i class="fas fa-info-circle"></i> Follow these steps to set up Google Authenticator:</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; align-items: start;">
      <div style="text-align: left; background: #f9f9f9; padding: 1.25rem; border-radius: 8px;">
        <div style="margin-bottom: 1rem;">
          <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #333; font-size: 0.9rem;">
            <span style="background: #007bff; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.5rem;">1</span>
            Download Google Authenticator App
          </p>
          <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.85rem; padding-left: 1.75rem;">
            • For <strong>iPhone/iPad:</strong> Open App Store, search "Google Authenticator", and install<br>
            • For <strong>Android:</strong> Open Google Play Store, search "Google Authenticator", and install<br>
            • Or use any TOTP app like Microsoft Authenticator, Authy, etc.
          </p>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #333; font-size: 0.9rem;">
            <span style="background: #007bff; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.5rem;">2</span>
            Open the App and Add Account
          </p>
          <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.85rem; padding-left: 1.75rem;">
            • Open Google Authenticator app on your phone<br>
            • Tap the <strong>"+"</strong> button or <strong>"Add account"</strong><br>
            • Select <strong>"Scan a QR code"</strong>
          </p>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #333; font-size: 0.9rem;">
            <span style="background: #007bff; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.5rem;">3</span>
            Scan the QR Code
          </p>
          <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.85rem; padding-left: 1.75rem;">
            • Point your phone's camera at the QR code<br>
            • The app will automatically detect and add your account<br>
            • You'll see a 6-digit code that changes every 30 seconds
          </p>
        </div>
        
        <div style="margin-bottom: 0;">
          <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #333; font-size: 0.9rem;">
            <span style="background: #007bff; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 0.5rem;">4</span>
            Using for Password Reset
          </p>
          <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.85rem; padding-left: 1.75rem;">
            • When resetting your password, open Google Authenticator<br>
            • Enter the current 6-digit code shown in the app<br>
            • The code refreshes every 30 seconds, so use the latest one
          </p>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="margin-bottom: 1rem; background: white; padding: 1.5rem; border: 2px dashed #ddd; border-radius: 8px; width: 100%;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 300px; width: 100%; border-radius: 4px;">
        </div>
        <details style="margin-top: 0; text-align: left; background: #f5f5f5; padding: 1rem; border-radius: 6px; cursor: pointer; width: 100%;">
          <summary style="font-weight: 600; color: #666; font-size: 0.85rem; user-select: none;">
            <i class="fas fa-key"></i> Can't scan? Enter secret manually
          </summary>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #ddd;">
            <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.8rem;">In Google Authenticator, select "Enter a setup key" and use:</p>
            <div style="background: white; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem; font-family: monospace; word-break: break-all; font-size: 0.8rem; border: 1px solid #ddd;">
              ${secret}
            </div>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.75rem;">Account name: <strong>${username}</strong> | Type: <strong>Time-based</strong></p>
          </div>
        </details>
      </div>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin-top: 0; text-align: left; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 0.85rem; line-height: 1.5;">
        <strong><i class="fas fa-exclamation-triangle"></i> Important:</strong> Save this QR code or secret key in a safe place. 
        You'll need the 6-digit code from Google Authenticator every time you reset your password. 
        If you lose access to your phone, contact the system administrator.
      </p>
    </div>
    
    <button onclick="document.getElementById('qrCodeModalOverlay').remove()" style="margin-top: 1.5rem; padding: 0.875rem 2.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; box-shadow: 0 2px 4px rgba(0,123,255,0.3);">
      <i class="fas fa-check"></i> I've Set Up Google Authenticator
    </button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Admin creation form submission
const adminCreateForm = document.getElementById('adminCreateForm');
if (adminCreateForm) {
  adminCreateForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminPassword2').value;
    
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    
    const favoriteColorValue = document.getElementById('adminFavoriteColor')?.value || '';
    const formData = {
      firstName: document.getElementById('adminFirstName').value,
      lastName: document.getElementById('adminLastName').value,
      username: document.getElementById('adminUsername').value,
      password: password,
      favoriteColor: favoriteColorValue || undefined
    };
    
    await createAdmin(formData);
  });
}

// Search and View Functions
let currentSearchResults = [];

async function performSearch() {
  const searchForm = document.getElementById('searchForm');
  const formData = new FormData(searchForm);
  
  // Build query parameters
  const params = new URLSearchParams();
  for (let [key, value] of formData.entries()) {
    if (value.trim()) {
      params.append(key, value.trim());
    }
  }
  
  const searchLoadingDiv = document.getElementById('searchLoading');
  const searchErrorDiv = document.getElementById('searchError');
  const noResultsDiv = document.getElementById('noResults');
  const searchResultsTableDiv = document.getElementById('searchResultsTable');
  const resultsCountSpan = document.getElementById('resultsCount');
  
  // Show loading state
  searchLoadingDiv.style.display = 'block';
  searchErrorDiv.style.display = 'none';
  noResultsDiv.style.display = 'none';
  searchResultsTableDiv.style.display = 'none';
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to search research papers');
    }
    
    currentSearchResults = await response.json();
    displaySearchResults();
    
    // Update results count
    resultsCountSpan.textContent = `${currentSearchResults.length} result${currentSearchResults.length !== 1 ? 's' : ''} found`;
    
    // Show results
    searchLoadingDiv.style.display = 'none';
    if (currentSearchResults.length === 0) {
      noResultsDiv.style.display = 'block';
    } else {
      searchResultsTableDiv.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error searching research:', error);
    searchLoadingDiv.style.display = 'none';
    searchErrorDiv.style.display = 'block';
  }
}

function displaySearchResults() {
  const tableBody = document.getElementById('searchResultsBody');
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add search result rows
  currentSearchResults.forEach(paper => {
    const row = document.createElement('tr');
    
    // Create view PDF link
    const viewPdfLink = paper.pdfFilePath ? 
      `<a href="${API_BASE_URL}/api/research/${paper._id}/pdf" target="_blank" class="view-pdf-link">View PDF</a>` : 
      '<span class="no-pdf">No PDF</span>';
    
    row.innerHTML = `
      <td title="${paper.title}">${paper.title.length > 50 ? paper.title.substring(0, 50) + '...' : paper.title}</td>
      <td title="${paper.authors.join(', ')}">${paper.authors.join(', ').length > 30 ? paper.authors.join(', ').substring(0, 30) + '...' : paper.authors.join(', ')}</td>
      <td>${paper.program}</td>
      <td>${paper.department}</td>
      <td>${paper.year}</td>
      <td><span class="status-badge status-${paper.status}">${paper.status}</span></td>
      <td>
        ${viewPdfLink}
        ${paper.status === 'pending' ? `
          <button class="action-btn approve-btn" onclick="approveResearch('${paper._id}', 'approved')">Approve</button>
          <button class="action-btn reject-btn" onclick="approveResearch('${paper._id}', 'rejected')">Reject</button>
        ` : ''}
        ${paper.status === 'rejected' ? `
          <button class="action-btn approve-btn" onclick="approveResearch('${paper._id}', 'approved')">Approve</button>
        ` : ''}
        <button class="action-btn delete-btn" onclick="deleteResearch('${paper._id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function clearSearch() {
  const searchForm = document.getElementById('searchForm');
  searchForm.reset();
  
  // Hide all result states
  document.getElementById('searchLoading').style.display = 'none';
  document.getElementById('searchError').style.display = 'none';
  document.getElementById('noResults').style.display = 'none';
  document.getElementById('searchResultsTable').style.display = 'none';
  
  // Reset results count
  document.getElementById('resultsCount').textContent = '0 results found';
  
  // Clear results
  currentSearchResults = [];
  document.getElementById('searchResultsBody').innerHTML = '';
}

// Search form submission
const searchForm = document.getElementById('searchForm');
if (searchForm) {
  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await performSearch();
  });
}

// Load users when admin dashboard loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking for admin dashboard elements...');
  if (document.getElementById('studentsTable') || document.getElementById('adminsTable')) {
    console.log('Found admin dashboard tables, loading users...');
    loadUsers();
  }
  if (document.getElementById('researchTable')) {
    console.log('Found research table, loading research...');
    loadResearch();
  }
  if (document.getElementById('statistics')) {
    console.log('Found statistics section, loading statistics...');
    loadStatistics();
  }

  // Initialize wizard if present
  if (document.getElementById('uploadWizardForm')) {
    console.log('Found wizard form, initializing wizard...');
    initializeWizard();
  }

  // Initialize student dashboard search if present (only on student dashboard)
  if (document.getElementById('searchInput') && document.getElementById('resultsGrid') && document.getElementById('studentName')) {
    console.log('Found student search elements, initializing search...');
    initializeStudentSearch();
  }

  // Initialize backup button if present
  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', downloadBackup);
  }

  // Initialize restore controls if present
  const restoreBtn = document.getElementById('restoreBtn');
  const restoreInput = document.getElementById('restoreInput');
  if (restoreBtn && restoreInput) {
    restoreBtn.addEventListener('click', () => restoreFromBackup(restoreInput));
  }

  // Initialize clear all controls if present
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllResearch);
  }

  // Initialize dark mode toggle if present
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // Load saved theme preference
    loadThemePreference();
  }

  // Toggle advanced filters in Search tab
  const toggleAdvancedBtn = document.getElementById('toggleAdvancedFilters');
  const advancedFilters = document.getElementById('advancedFilters');
  if (toggleAdvancedBtn && advancedFilters) {
    toggleAdvancedBtn.addEventListener('click', () => {
      const visible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = visible ? 'none' : 'block';
    toggleAdvancedBtn.textContent = visible ? '+ Add filters' : '− Hide filters';
    });
  }

  // Open Change Password Modal button
  const openPwdBtn = document.getElementById('openChangePasswordModalBtn');
  if (openPwdBtn) openPwdBtn.addEventListener('click', openChangePasswordModal);

  attachPasswordToggleListeners();
  // Add to modals when opened too
  if (openPwdBtn) {
    openPwdBtn.addEventListener('click', function(){
      openChangePasswordModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('changePasswordModal')), 50);
    });
  }
  const openCreateAdminBtn = document.querySelector('[onclick="openCreateAdminModal()"]');
  if (openCreateAdminBtn) {
    openCreateAdminBtn.addEventListener('click', function(){
      openCreateAdminModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('createAdminModal')), 50);
    });
  }
});

// Show error message inline
function showFormError(form, message) {
  let errorDiv = form.querySelector('.form-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.style.color = 'red';
    errorDiv.style.marginBottom = '8px';
    form.insertBefore(errorDiv, form.firstChild.nextSibling);
  }
  errorDiv.textContent = message;
}

// Show success message inline
function showFormSuccess(form, message) {
  let successDiv = form.querySelector('.form-success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.style.color = 'green';
    successDiv.style.marginBottom = '8px';
    form.insertBefore(successDiv, form.firstChild.nextSibling);
  }
  successDiv.textContent = message;
  // Remove error if present
  let errorDiv = form.querySelector('.form-error');
  if (errorDiv) errorDiv.textContent = '';
}

// Forgot Password Form Handling
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  const identifierField = document.getElementById('identifier');
  const adminExtraFields = document.getElementById('adminExtraFields');
  const submitButtonText = document.getElementById('submitButtonText');
  
  // Detect role on blur
  identifierField.addEventListener('blur', async function() {
    const val = identifierField.value.trim();
    if (!val) return;
    // Call backend probe to get role
    try {
      const resp = await fetch(`${API_BASE_URL}/api/reset/probe-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: val })
      });
      const data = await resp.json();
      if (data.role === 'admin') {
        adminExtraFields.style.display = 'block';
        submitButtonText.textContent = 'Reset Password';
        // Set relevant required fields
        document.getElementById('adminTotpCode').required = true;
        document.getElementById('adminNewPassword').required = true;
        document.getElementById('adminConfirmNewPassword').required = true;
      } else {
        adminExtraFields.style.display = 'none';
        submitButtonText.textContent = 'Submit Reset Request';
    document.getElementById('adminTotpCode').required = false;
    document.getElementById('adminNewPassword').required = false;
    document.getElementById('adminConfirmNewPassword').required = false;
  }
    } catch {
      // default to student
      adminExtraFields.style.display = 'none';
        submitButtonText.textContent = 'Submit Reset Request';
    }
  });

  forgotPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const identifier = identifierField.value.trim();
    if (!identifier) {
      showFormError(forgotPasswordForm, 'Please enter your identifier.');
      return;
    }
    // Call probe, branch by result
    let role = 'student';
    try {
      const resp = await fetch(`${API_BASE_URL}/api/reset/probe-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await resp.json();
      role = data.role;
    } catch {}
    if (role === 'admin') {
      const totpCode = document.getElementById('adminTotpCode').value;
      const newPassword = document.getElementById('adminNewPassword').value;
      const confirmPassword = document.getElementById('adminConfirmNewPassword').value;
      if (!totpCode || !newPassword || !confirmPassword) {
        showFormError(forgotPasswordForm, 'Please fill all admin fields.');
        return;
      }
      if (!/^[0-9]{6}$/.test(totpCode)) {
        showFormError(forgotPasswordForm, 'TOTP code must be exactly 6 digits.');
        return;
      }
      if (newPassword.length < 6) {
        showFormError(forgotPasswordForm, 'Password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        showFormError(forgotPasswordForm, 'Passwords do not match.');
        return;
      }
      // Confirmation dialog
      if (!confirm('Are you sure you want to reset your password?')) {
        return;
      }
      // POST admin reset
      try {
        const response = await fetch(`${API_BASE_URL}/api/reset/admin-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier, totpCode, newPassword })
        });
        const data = await response.json();
        if (response.ok) {
          forgotPasswordForm.style.display = 'none';
          // Show admin success card visually
          const contentSide = document.querySelector('.content-side');
          const successCard = document.createElement('div');
          successCard.style.background = '#fff';
          successCard.style.borderRadius = '14px';
          successCard.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)';
          successCard.style.padding = '32px 28px 20px 28px';
          successCard.style.margin = '40px auto 0 auto';
          successCard.style.maxWidth = '400px';
          successCard.style.textAlign = 'center';
          successCard.style.display = 'flex';
          successCard.style.flexDirection = 'column';
          successCard.style.alignItems = 'center';
          successCard.style.gap = '16px';
          successCard.innerHTML = `
            <p style="font-size: 1.13rem; line-height: 1.6;">
              <strong>Password reset successfully!</strong><br>
              Your password has been updated. You can now login with your new password.
            </p>
            <a href="index.html" class="btn btn-outline-primary"><i class="fas fa-arrow-left"></i> Back to Login</a>
          `;
          contentSide.appendChild(successCard);
        } else {
          showFormError(forgotPasswordForm, data.message || 'Failed to reset password.');
        }
      } catch {
        showFormError(forgotPasswordForm, 'Could not connect to server.');
      }
    } else {
      // Student flow
      try {
        const response = await fetch(`${API_BASE_URL}/api/reset/request-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolId: identifier })
        });
        const data = await response.json();
        if (response.ok) {
          // Hide the form
          forgotPasswordForm.style.display = 'none';
          // Insert feedback card for students
          const contentSide = document.querySelector('.content-side');
          const successCard = document.createElement('div');
          successCard.style.background = '#fff';
          successCard.style.borderRadius = '14px';
          successCard.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)';
          successCard.style.padding = '32px 28px 20px 28px';
          successCard.style.margin = '40px auto 0 auto';
          successCard.style.maxWidth = '400px';
          successCard.style.textAlign = 'center';
          successCard.style.display = 'flex';
          successCard.style.flexDirection = 'column';
          successCard.style.alignItems = 'center';
          successCard.style.gap = '16px';
          successCard.innerHTML = `
            <p style="font-size: 1.13rem; line-height: 1.6;">
              <strong>Reset request submitted successfully!</strong><br>
              Your password will be reset to your School ID once approved.<br>
              You may approach <strong>Ms. Kathline Ventura</strong> in room 103 to expedite approval.
            </p>
            <a href="index.html" class="btn btn-outline-primary"><i class="fas fa-arrow-left"></i> Back to Login</a>
          `;
          contentSide.appendChild(successCard);
        } else {
          showFormError(forgotPasswordForm, data.message || 'Failed to submit reset request.');
        }
      } catch {
        showFormError(forgotPasswordForm, 'Could not connect to server.');
      }
    }
  });
}

// Reset Password Requests Handling in Admin Dashboard
async function loadResetRequests() {
  if (!document.getElementById('resetRequestsSection')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/reset/reset-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const requests = await response.json();
    const badge = document.getElementById('resetRequestsBadge');
    
    if (requests.length > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = requests.length;
    } else {
      badge.style.display = 'none';
    }

    const tableBody = document.getElementById('resetRequestsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = requests.map(request => `
      <tr>
        <td>${request.userId.schoolId}</td>
        <td>${request.userId.firstName} ${request.userId.lastName}</td>
        <td>${new Date(request.createdAt).toLocaleString()}</td>
        <td>
          <div class="reset-action-btns">
            <button onclick="handleResetRequest('${request._id}', 'approved')" class="action-btn approve-btn">Approve</button>
            <button onclick="handleResetRequest('${request._id}', 'rejected')" class="action-btn reject-btn">Reject</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading reset requests:', error);
  }
}

async function handleResetRequest(requestId, status) {
  try {
    const token = localStorage.getItem('token');
    
    // First, get the user's school ID
    const requestResponse = await fetch(`${API_BASE_URL}/api/reset/reset-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const requests = await requestResponse.json();
    const request = requests.find(r => r._id === requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/reset/reset-request/${requestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status, 
        newPassword: status === 'approved' ? request.userId.schoolId : undefined 
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      if (status === 'approved') {
        alert(`Password has been reset to the student's School ID`);
      } else {
        alert('Reset request rejected');
      }
      loadResetRequests(); // Refresh the list
    } else {
      alert(data.message || 'Failed to process reset request');
    }
  } catch (error) {
    console.error('Error handling reset request:', error);
    alert('Failed to process reset request');
  }
}

// Statistics Functions
async function loadStatistics() {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('Fetching statistics from:', `${API_BASE_URL}/api/statistics/overall`);
    console.log('Headers being sent:', headers);
    
    // Fetch all statistics in parallel
    const [overallStats, departmentStats, yearlyStats, trendStats] = await Promise.all([
      fetch(`${API_BASE_URL}/api/statistics/overall`, { headers }).then(res => {
        console.log('Overall stats response status:', res.status);
        if (!res.ok) {
          throw new Error(`Statistics API returned ${res.status}`);
        }
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/statistics/by-department`, { headers }).then(res => {
        if (!res.ok) throw new Error(`Department API returned ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/statistics/by-year`, { headers }).then(res => {
        if (!res.ok) throw new Error(`Year API returned ${res.status}`);
        return res.json();
      }),
      fetch(`${API_BASE_URL}/api/statistics/trends`, { headers }).then(res => {
        if (!res.ok) throw new Error(`Trends API returned ${res.status}`);
        return res.json();
      })
    ]);

    console.log('Overall stats received:', overallStats);
    console.log('Stats structure:', {
      totals: overallStats.totals,
      pendingApprovals: overallStats.pendingApprovals,
      resetRequests: overallStats.resetRequests
    });

    // Update summary cards
    const totalResearchEl = document.getElementById('totalResearchPapers');
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalAdminsEl = document.getElementById('totalAdmins');
    const pendingApprovalsEl = document.getElementById('pendingApprovals');
    const resetRequestsEl = document.getElementById('resetRequests');
    const totalViewsEl = document.getElementById('totalViews');
    
    console.log('Elements found:', {
      totalResearch: !!totalResearchEl,
      totalStudents: !!totalStudentsEl,
      totalAdmins: !!totalAdminsEl,
      pendingApprovals: !!pendingApprovalsEl,
      resetRequests: !!resetRequestsEl,
      totalViews: !!totalViewsEl
    });
    
    // Handle the response structure - check if totals.students and totals.admins exist
    const students = overallStats.totals?.students || 0;
    const admins = overallStats.totals?.admins || 0;
    const research = overallStats.totals?.research || 0;
    const pendingApprovals = overallStats.pendingApprovals || 0;
    const resetRequests = overallStats.resetRequests || 0;
    const totalViews = overallStats.totals?.views || 0;
    
    console.log('Extracted values:', { students, admins, research, pendingApprovals, resetRequests, totalViews });
    
    if (totalResearchEl) totalResearchEl.textContent = research;
    if (totalStudentsEl) totalStudentsEl.textContent = students;
    if (totalAdminsEl) totalAdminsEl.textContent = admins;
    if (pendingApprovalsEl) pendingApprovalsEl.textContent = pendingApprovals;
    if (resetRequestsEl) resetRequestsEl.textContent = resetRequests;
    if (totalViewsEl) totalViewsEl.textContent = totalViews;

    // Update department statistics table
    const departmentTableBody = document.getElementById('departmentStats');
    if (departmentTableBody) {
      departmentTableBody.innerHTML = departmentStats
        .map(stat => `
          <tr>
            <td>${stat.department}</td>
            <td>${stat.count}</td>
            <td>${stat.percentage}%</td>
          </tr>
        `)
        .join('');
    } else {
      console.log('Department stats table not found - skipping table update');
    }

    // Create department chart (filtered by Year/Semester like Adviser)
    async function redrawDepartmentFromFilters(){
      const el = document.getElementById('departmentChart');
      if (!el) return;
      const yearSel = document.getElementById('chartDepartmentYear');
      const semSel = document.getElementById('chartDepartmentSemester');
      const params = new URLSearchParams();
      if (yearSel && yearSel.value) params.set('year', yearSel.value);
      if (semSel && semSel.value) params.set('semester', semSel.value);
      const res = await fetch(`${API_BASE_URL}/api/statistics/by-department${params.toString() ? ('?' + params.toString()) : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const dep = await res.json();
      if (window.departmentChartInstance) window.departmentChartInstance.destroy();
      const ctx = el.getContext('2d');
      const labels = dep.map(stat => stat.department || 'Unknown');
      // Map of department names to required acronyms
      const departmentAcronymMap = {
        'Marine Engineering': 'BSME',
        'Marine Transportation': 'BSMT',
        'Criminology': 'BSCRIM',
        'Tourism Management': 'BSTM',
        'Technical-Vocational Teacher Education': 'BTVTED',
        'Early Childhood Education': 'EDUC',
        'Information System': 'BSIS',
        'Entrepreneurship': 'BSE',
        'Management Accounting': 'BSMA',
        'Nursing': 'BSN',
        'Humanities and Social Sciences': 'HUMSS',
        'Accountancy, Business and Management': 'ABM',
        'Science, Technology, Engineering and Mathematics': 'STEM',
        'General Academic Strand': 'GAS',
        'Other': 'Other'
      };
      const toAcr = (name) => {
        if (!name) return 'N/A';
        // Use strict match first
        if (departmentAcronymMap[name.trim()]) {
          return departmentAcronymMap[name.trim()];
        }
        // Try relaxed case-insensitive match
        const key = Object.keys(departmentAcronymMap).find(dep => dep.trim().toLowerCase()===name.trim().toLowerCase());
        if (key) return departmentAcronymMap[key];
        // Try substring match as fallback (partial name inside key)
        const partial = Object.keys(departmentAcronymMap).find(dep => name.toLowerCase().includes(dep.toLowerCase()));
        if (partial) return departmentAcronymMap[partial];
        // Fallback - parenthesis or initials
        const m = name.match(/\(([^)]+)\)/);
        if (m && m[1]) return m[1].trim();
        return name.replace(/[^A-Za-z\s]/g,' ').split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()).join('');
      };
      const acronyms = labels.map(toAcr);
      const values = dep.map(stat => stat.count);
      const colors = dep.map((_, i) => `hsl(${(i*67)%360} 70% 62%)`);
      
      // Destroy existing chart before creating new one
      if (window.departmentChartInstance) {
        window.departmentChartInstance.destroy();
      }
      
      window.departmentChartInstance = new Chart(ctx, {
        type: 'pie',
        data: { labels: acronyms, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                // Show full department name with count in tooltip
                label: function(context) {
                  const idx = context.dataIndex;
                  const fullName = labels[idx] || acronyms[idx];
                  const val = values[idx];
                  const pct = Math.round(values[idx] / (values.reduce((a,b)=>a+b,0)||1) * 100);
                  return `${fullName}: ${val} (${pct}%)`;
                }
            }
          }
        }
      }
    });
      const legend = document.getElementById('departmentLegend');
      if (legend){
        const total = values.reduce((a,b)=>a+b,0)||1;
        legend.innerHTML = '<h4>Departments</h4>' + labels.map((name,i)=>{
          const pct = Math.round(values[i]/total*100);
          return `<div class=\"dept-item\"><span><span class=\"dot\" style=\"background:${colors[i]}\"></span>${toAcr(name)}</span><strong>${values[i]} (${pct}%)</strong></div>`;
        }).join('');
      }
    }
    await redrawDepartmentFromFilters();
    document.getElementById('chartDepartmentYear')?.addEventListener('change', redrawDepartmentFromFilters);
    document.getElementById('chartDepartmentSemester')?.addEventListener('change', redrawDepartmentFromFilters);

    // Create yearly chart
    const yearlyChart = document.getElementById('yearlyChart');
    if (yearlyChart) {
      // Destroy existing chart if it exists
      if (window.yearlyChartInstance) {
        window.yearlyChartInstance.destroy();
      }
      
      const yearlyCtx = yearlyChart.getContext('2d');
      window.yearlyChartInstance = new Chart(yearlyCtx, {
      type: 'line',
      data: {
        labels: yearlyStats.map(stat => stat._id),
        datasets: [{
          label: 'Research Papers per Year',
          data: yearlyStats.map(stat => stat.count),
          borderColor: 'rgba(37, 99, 235, 1)',
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    } else {
      console.log('Yearly chart not found - skipping chart creation');
    }

    // Create trend chart
    const trendChart = document.getElementById('trendChart');
    if (trendChart) {
      // Destroy existing chart if it exists
      if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
      }
      
      const trendCtx = trendChart.getContext('2d');
      window.trendChartInstance = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: trendStats.map(stat => `${stat._id.year}-${stat._id.month}`),
        datasets: [{
          label: 'Monthly Uploads',
          data: trendStats.map(stat => stat.count),
          borderColor: 'rgba(37, 99, 235, 1)',
          tension: 0.1,
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    } else {
      console.log('Trend chart not found - skipping chart creation');
    }

    console.log('Statistics loaded successfully');

  } catch (error) {
    console.error('Error loading statistics:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('API_BASE_URL:', API_BASE_URL);
    console.error('Token exists:', !!localStorage.getItem('token'));
    
    // Set default values on error
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalAdminsEl = document.getElementById('totalAdmins');
    const pendingApprovalsEl = document.getElementById('pendingApprovals');
    const resetRequestsEl = document.getElementById('resetRequests');
    const totalViewsEl = document.getElementById('totalViews');
    
    if (totalStudentsEl) totalStudentsEl.textContent = '0';
    if (totalAdminsEl) totalAdminsEl.textContent = '0';
    if (pendingApprovalsEl) pendingApprovalsEl.textContent = '0';
    if (resetRequestsEl) resetRequestsEl.textContent = '0';
    if (totalViewsEl) totalViewsEl.textContent = '0';
    
    alert('Failed to load statistics. Please try again.');
  }
}

// Export statistics
async function exportStatistics(format) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/statistics/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export statistics');
    }

    // Handle the downloaded file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-statistics.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

  } catch (error) {
    console.error('Error exporting statistics:', error);
    alert('Failed to export statistics. Please try again.');
  }
}

// Multi-Step Wizard Functions
let currentWizardStep = 1;
let isWizardUploading = false;
let wizardAuthors = [];
let wizardKeywords = [];
let wizardAdvisers = [];

function initializeWizard() {
  console.log('Initializing wizard...');
  
  // Populate year dropdown
  populateYearDropdown();
  
  // Initialize tag inputs
  initializeWizardTagInputs();
  
  // Initialize file upload
  initializeWizardFileUpload();
  
  // Initialize form submission
  initializeWizardFormSubmission();
  
  console.log('Wizard initialized successfully');
}

function populateYearDropdown() {
  const yearSelect = document.getElementById('wizardYear');
  if (!yearSelect) return;
  
  const currentYear = new Date().getFullYear();
  // Reverse the loop to show highest year first
  for (let year = currentYear; year >= 2000; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function showOnlyStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.remove('wizard-step-active');
    step.style.display = 'none';
  });
  
  // Show current step
  const currentStep = document.getElementById(`uploadStep${stepNumber}`);
  if (currentStep) {
    currentStep.classList.add('wizard-step-active');
    currentStep.style.display = 'block';
  }
  
  // Update progress indicator
  document.querySelectorAll('.wizard-step-label').forEach((label, index) => {
    const stepNum = index + 1;
    label.classList.remove('active', 'completed');
    
    if (stepNum === stepNumber) {
      label.classList.add('active');
    } else if (stepNum < stepNumber) {
      label.classList.add('completed');
    }
  });
  
  currentWizardStep = stepNumber;
}

function nextStep1() {
  console.log('Validating step 1...');
  
  const title = document.getElementById('wizardTitle');
  const year = document.getElementById('wizardYear');
  const semester = document.getElementById('wizardSemester');
  const department = document.getElementById('wizardDepartment');
  const adviser = document.getElementById('wizardAdviser');
  
  // Clear previous errors
  clearStepErrors(1);
  
  let hasErrors = false;
  
  if (!title.value.trim()) {
    showFieldErr(title, 'Title is required');
    hasErrors = true;
  }
  
  if (!year.value) {
    showFieldErr(year, 'Year is required');
    hasErrors = true;
  }
  
  if (!semester.value) {
    showFieldErr(semester, 'Semester is required');
    hasErrors = true;
  }
  
  if (!department.value) {
    showFieldErr(department, 'Department is required');
    hasErrors = true;
  }
  
  if (!adviser.value.trim()) {
    showFieldErr(adviser, 'Adviser is required');
    hasErrors = true;
  }
  
  if (!hasErrors) {
    showOnlyStep(2);
  }
}

function nextStep2() {
  console.log('Validating step 2...');
  // Clear previous errors
  clearStepErrors(2);
  
  if (wizardAuthors.length === 0) {
    const authorsInput = document.getElementById('wizardAuthorsInput');
    showFieldErr(authorsInput, 'At least one author is required');
    return;
  }
  if (wizardKeywords.length === 0) {
    const keywordsInput = document.getElementById('wizardKeywordsInput');
    showFieldErr(keywordsInput, 'At least one keyword is required');
    return;
  }
  showOnlyStep(3);
}

function backStep2() {
  showOnlyStep(1);
}

function backStep3() {
  showOnlyStep(2);
}

function showFieldErr(input, msg) {
  const existingErr = input.parentNode.querySelector('.field-error');
  if (existingErr) existingErr.remove();
  
  const err = document.createElement('div');
  err.className = 'field-error';
  err.style.color = '#dc3545';
  err.style.fontSize = '14px';
  err.style.marginTop = '4px';
  err.textContent = msg;
  input.parentNode.appendChild(err);
}

function clearStepErrors(stepNum) {
  const step = document.getElementById(`uploadStep${stepNum}`);
  if (step) {
    step.querySelectorAll('.field-error').forEach(err => err.remove());
  }
}

function initializeWizardTagInputs() {
  // Authors tag input
  const authorsInput = document.getElementById('wizardAuthorsInput');
  if (authorsInput) {
    authorsInput.addEventListener('keydown', function(e) {
      if (e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        addWizardAuthor();
      }
    });
  }
  
  // Keywords tag input
  const keywordsInput = document.getElementById('wizardKeywordsInput');
  if (keywordsInput) {
    keywordsInput.addEventListener('keydown', function(e) {
      if (e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        addWizardKeyword();
      }
    });
  }
  
  // Advisers tag input
  const adviserInput = document.getElementById('wizardAdviserInput');
  if (adviserInput) {
    adviserInput.addEventListener('keydown', function(e) {
      if (e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        addWizardAdviser();
      }
    });
  }
}

function addWizardAuthor() {
  const input = document.getElementById('wizardAuthorsInput');
  const value = input.value.trim();
  
  if (value && !wizardAuthors.includes(value)) {
    wizardAuthors.push(value);
    input.value = '';
    renderWizardAuthors();
    updateWizardAuthorsHidden();
  }
}

function removeWizardAuthor(author) {
  wizardAuthors = wizardAuthors.filter(a => a !== author);
  renderWizardAuthors();
  updateWizardAuthorsHidden();
}

function renderWizardAuthors() {
  const container = document.getElementById('wizardAuthorsTags');
  if (!container) return;
  
  container.innerHTML = '';
  wizardAuthors.forEach(author => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      ${author}
      <button type="button" class="tag-remove" onclick="removeWizardAuthor('${author}')">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(tag);
  });
}

function updateWizardAuthorsHidden() {
  const hidden = document.getElementById('wizardAuthors');
  if (hidden) {
    hidden.value = wizardAuthors.join(',');
  }
}

function addWizardKeyword() {
  const input = document.getElementById('wizardKeywordsInput');
  const value = input.value.trim();
  
  if (value && !wizardKeywords.includes(value)) {
    wizardKeywords.push(value);
    input.value = '';
    renderWizardKeywords();
    updateWizardKeywordsHidden();
  }
}

function removeWizardKeyword(keyword) {
  wizardKeywords = wizardKeywords.filter(k => k !== keyword);
  renderWizardKeywords();
  updateWizardKeywordsHidden();
}

function renderWizardKeywords() {
  const container = document.getElementById('wizardKeywordsTags');
  if (!container) return;
  
  container.innerHTML = '';
  wizardKeywords.forEach(keyword => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      ${keyword}
      <button type="button" class="tag-remove" onclick="removeWizardKeyword('${keyword}')">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(tag);
  });
}

function updateWizardKeywordsHidden() {
  const hidden = document.getElementById('wizardKeywords');
  if (hidden) {
    hidden.value = wizardKeywords.join(',');
  }
}


// Adviser Tag Functions
function addWizardAdviser() {
  const input = document.getElementById('wizardAdviserInput');
  const value = input.value.trim();
  
  if (value && !wizardAdvisers.includes(value)) {
    wizardAdvisers.push(value);
    input.value = '';
    renderWizardAdvisers();
    updateWizardAdviserHidden();
  }
}

function removeWizardAdviser(adviser) {
  wizardAdvisers = wizardAdvisers.filter(a => a !== adviser);
  renderWizardAdvisers();
  updateWizardAdviserHidden();
}

function renderWizardAdvisers() {
  const container = document.getElementById('wizardAdviserTags');
  if (!container) return;
  
  container.innerHTML = '';
  wizardAdvisers.forEach(adviser => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      ${adviser}
      <button type="button" class="tag-remove" onclick="removeWizardAdviser('${adviser}')">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(tag);
  });
}

function updateWizardAdviserHidden() {
  const hidden = document.getElementById('wizardAdviser');
  if (hidden) {
    hidden.value = wizardAdvisers.join(',');
    // Validate that at least one adviser is added
    if (wizardAdvisers.length === 0) {
      hidden.setCustomValidity('Please add at least one adviser.');
    } else {
      hidden.setCustomValidity('');
    }
  }
}

function initializeWizardFileUpload() {
  const fileInput = document.getElementById('wizardPdf');
  const uploadArea = document.getElementById('wizardFileUploadArea');
  const fileDisplay = document.getElementById('wizardFileDisplay');
  
  if (!fileInput || !uploadArea) return;
  
  // Click to browse with debounce to avoid double-open
  let wizardFileDialogOpen = false;
  uploadArea.addEventListener('click', (e) => {
    if (e.target === fileInput) return; // native input click
    if (wizardFileDialogOpen) return;
    e.preventDefault();
    e.stopPropagation();
    wizardFileDialogOpen = true;
    fileInput.click();
    setTimeout(() => { wizardFileDialogOpen = false; }, 800);
  });
  
  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setWizardFile(files[0]);
    }
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      setWizardFile(e.target.files[0]);
    }
  });
}

function setWizardFile(file) {
  if (!file) return;
  
  // Validate file type
  if (file.type !== 'application/pdf') {
    alert('Please select a PDF file.');
    return;
  }
  
  // Validate file size (200MB)
  const maxSize = 200 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size must be less than 200MB.');
    return;
  }
  
  // Update file input
  const fileInput = document.getElementById('wizardPdf');
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  
  // Show file info
  const fileDisplay = document.getElementById('wizardFileDisplay');
  const fileName = fileDisplay.querySelector('.file-name');
  const fileSize = fileDisplay.querySelector('.file-size');
  
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = formatFileSize(file.size);
  
  fileDisplay.style.display = 'flex';
}

function removeWizardFile() {
  const fileInput = document.getElementById('wizardPdf');
  const fileDisplay = document.getElementById('wizardFileDisplay');
  
  fileInput.value = '';
  fileDisplay.style.display = 'none';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function initializeWizardFormSubmission() {
  const form = document.getElementById('uploadWizardForm');
  if (!form) return;
  
  form.addEventListener('submit', submitWizard);
}

async function submitWizard(e) {
  e.preventDefault();
  console.log('Submitting wizard form...');
  if (isWizardUploading) return; // prevent duplicate submissions
  
  // Validate step 3
  const fileInput = document.getElementById('wizardPdf');
  if (!fileInput.files.length) {
    alert('Please select a PDF file.');
    return;
  }
  
  const file = fileInput.files[0];
  if (file.type !== 'application/pdf') {
    alert('Please select a PDF file.');
    return;
  }
  
  if (file.size > 200 * 1024 * 1024) {
    alert('File size must be less than 200MB.');
    return;
  }
  
  // Prepare form data (read authors/keywords from hidden inputs to avoid scope divergence)
  const formData = new FormData();
  const titleVal = document.getElementById('wizardTitle').value;
  const yearVal = document.getElementById('wizardYear').value;
  const semesterVal = document.getElementById('wizardSemester').value;
  const departmentVal = document.getElementById('wizardDepartment').value;
  const adviserVal = document.getElementById('wizardAdviser').value;
  const authorsVal = (document.getElementById('wizardAuthors')?.value || '').trim();
  const keywordsVal = (document.getElementById('wizardKeywords')?.value || '').trim();

  // Front-end guard to mirror backend required fields
  if (!titleVal || !authorsVal || !adviserVal || !departmentVal || !yearVal || !semesterVal) {
    alert('Please complete all required fields before uploading (Title, Authors, Adviser(s), Department, Year, Semester).');
    return;
  }
  
  // Validate that at least one adviser is added
  if (wizardAdvisers.length === 0) {
    alert('Please add at least one adviser.');
    return;
  }

  formData.append('title', titleVal);
  formData.append('year', yearVal);
  formData.append('semester', semesterVal);
  formData.append('department', departmentVal);
  formData.append('adviser', adviserVal);
  formData.append('authors', authorsVal);
  formData.append('keywords', keywordsVal);
  formData.append('file', file);
  
  const submitBtn = document.getElementById('submitResearch');
  const originalText = submitBtn.innerHTML;
  
  try {
    isWizardUploading = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Research paper uploaded successfully!');
      // Reset form
      const wizardForm = document.getElementById('uploadWizardForm');
      if (wizardForm) wizardForm.reset();
      wizardAuthors = [];
      wizardKeywords = [];
      wizardAdvisers = [];
      renderWizardAuthors();
      renderWizardKeywords();
      renderWizardAdvisers();
      removeWizardFile();
      showOnlyStep(1);
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload research paper: ' + error.message);
  } finally {
    isWizardUploading = false;
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function exportPdfReport() {
  const btn = document.getElementById('exportDataBtn');
  const loader = document.getElementById('exportDataLoading');
  // -- FILTER LOGIC START --
  // Use chartDepartmentYear and chartDepartmentSemester from the analytics section
  const year = document.getElementById('chartDepartmentYear')?.value || '';
  const semester = document.getElementById('chartDepartmentSemester')?.value || '';
  let query = '';
  if (year && year !== '') query += `year=${encodeURIComponent(year)}`;
  if (semester && semester !== '') {
    if (query.length > 0) query += '&';
    query += `semester=${encodeURIComponent(semester)}`;
  }
  // -- FILTER LOGIC END --
  console.log('Export PDF - Filter values:', { year, semester, query });
  try {
    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    const token = localStorage.getItem('token');
    let url = `${API_BASE_URL}/api/statistics/export-pdf`;
    if (query.length > 0) url += `?${query}`;
    console.log('Export PDF - Full URL:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export PDF report');
    const blob = await response.blob();
    const dlUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    // Get Content-Disposition filename, fallback if not present
    let disposition = response.headers.get('Content-Disposition');
    let fname = 'Research_Statistics_Report.pdf';
    if (disposition && disposition.includes('filename=')) {
      fname = disposition.split('filename=')[1].replace(/["']/g, '');
    }
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(dlUrl);
    a.remove();
    alert('PDF report exported!');
  } catch (error) {
    alert('Failed to export PDF report: ' + (error.message || error));
  } finally {
    if (loader) loader.style.display = 'none';
    if (btn) btn.disabled = false;
  }
}

async function downloadBackup() {
  let btn, loadingEl;
  try {
    btn = document.getElementById('backupBtn');
    loadingEl = document.getElementById('backupLoading');
    if (btn) {
      btn.disabled = true;
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Downloading...';
    }
    if (loadingEl) loadingEl.style.display = 'inline-block';
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/research/backup`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      if (response.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
      }
      throw new Error('Failed to download backup');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_backup_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showNotification('Research backup (ZIP) downloaded successfully!', 'success');
  } catch (error) {
    console.error('downloadBackup error:', error);
    showNotification('Failed to download backup. Please try again.', 'error');
  }
  finally {
    if (btn) {
      btn.disabled = false;
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

async function restoreFromBackup(inputEl) {
  let btn, loadingEl;
  try {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) {
      showNotification('Please select a backup ZIP file.', 'error');
      return;
    }
    if (!/\.zip$/i.test(file.name)) {
      showNotification('Invalid file. Please select a .zip file.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('backup', file);

    btn = document.getElementById('restoreBtn');
    loadingEl = document.getElementById('restoreLoading');
    if (btn) {
      btn.disabled = true;
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Restoring...';
    }
    if (loadingEl) loadingEl.style.display = 'inline-block';

    const res = await fetch(`${API_BASE_URL}/api/research/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = (data && data.message) ? data.message : 'Failed to restore backup';
      throw new Error(msg);
    }

    const s = data.summary || {};
    showNotification(`Restore completed: ${s.created || 0} created, ${s.updated || 0} updated, ${s.skippedNoFile || 0} skipped.`, 'success');
    if (inputEl) inputEl.value = '';
  } catch (err) {
    console.error('restoreFromBackup error:', err);
    showNotification(err.message || 'Failed to restore backup.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

async function clearAllResearch() {
  let btn, loadingEl;
  try {
    const confirmText = 'This will delete ALL research records. This action cannot be undone. Continue?';
    const ok = window.confirm(confirmText);
    if (!ok) return;

    const keepFiles = !!(document.getElementById('keepFilesCheckbox') && document.getElementById('keepFilesCheckbox').checked);
    const token = localStorage.getItem('token');

    btn = document.getElementById('clearAllBtn');
    loadingEl = document.getElementById('clearAllLoading');
    if (btn) {
      btn.disabled = true;
      btn.dataset.origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Clearing...';
    }
    if (loadingEl) loadingEl.style.display = 'inline-block';

    const res = await fetch(`${API_BASE_URL}/api/research?keepFiles=${keepFiles ? 'true' : 'false'}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = (data && data.message) ? data.message : 'Failed to clear research';
      throw new Error(msg);
    }

    const deletedCount = data.deletedCount || 0;
    const filesDeleted = data.filesDeleted || 0;
    showNotification(`Cleared ${deletedCount} records${keepFiles ? '' : `, deleted ${filesDeleted} files`}.`, 'success');
  } catch (err) {
    console.error('clearAllResearch error:', err);
    showNotification(err.message || 'Failed to clear research.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// Show notification function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Archive research (Search & View and table)
async function archiveResearch(researchId) {
  // Confirm before proceeding
  const ok = window.confirm('Are you sure you want to archive this research? You can view archived items in Settings → Archived Research.');
  if (!ok) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/research/${researchId}/archive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to archive research');
    showNotification('Research archived successfully.', 'success');
    // Refresh: if search grid is visible, re-run search; else reload research table
    const grid = document.getElementById('resultsGrid');
    if (grid && grid.children && grid.children.length) {
      // Re-trigger current search page
      const doSearch = document.getElementById('doSearch');
      if (doSearch) doSearch.click();
    } else if (typeof loadResearch === 'function') {
      loadResearch();
    }
  } catch (e) {
    console.error('archiveResearch error:', e);
    showNotification(e.message || 'Failed to archive research', 'error');
  }
}

// Dark Mode Functions
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Set the new theme
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Save to localStorage
  localStorage.setItem('theme', newTheme);
  
  // Update button text and icon
  updateDarkModeButton(newTheme);
  
  // Show notification
  showNotification(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
}

function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeButton(savedTheme);
  }
}

function updateDarkModeButton(theme) {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    const icon = darkModeToggle.querySelector('i');
    const text = darkModeToggle.querySelector('span');
    
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      text.textContent = 'Light Mode';
    } else {
      icon.className = 'fas fa-moon';
      text.textContent = 'Dark Mode';
    }
  }
}

// Archived Research Functions
async function openArchived() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/research/archived`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch archived research');
    
    const modal = document.getElementById('archivedModal');
    const tbody = document.getElementById('archivedTableBody');
    
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
            <i class="fas fa-archive" style="margin-right: 0.5rem; color: #f59e0b;"></i>
            No archived research found
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = data.map(paper => `
        <tr>
          <td style="font-weight: 600; color: #1e293b;">${paper.title}</td>
          <td style="color: #64748b;">${paper.authors}</td>
          <td style="color: #64748b;">${paper.department}</td>
          <td style="color: #64748b;">${paper.year}</td>
          <td><span class="status-badge archived">Archived</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary" onclick="restoreResearch('${paper._id}')" style="margin-right: 0.5rem;">
              <i class="fas fa-undo"></i> Restore
            </button>
            ${paper.pdfFilePath ? `<a href="${API_BASE_URL}/api/research/${paper._id}/pdf" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-eye"></i> View PDF</a>` : ''}
          </td>
        </tr>
      `).join('');
    }
    
    modal.style.display = 'block';
  } catch (e) {
    console.error('Error loading archived research:', e);
    showNotification(e.message || 'Failed to load archived research', 'error');
  }
}

async function restoreResearch(researchId) {
  if (!confirm('Are you sure you want to restore this research? It will be visible in the main search again.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/research/${researchId}/restore`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to restore research');
    
    showNotification('Research restored successfully.', 'success');
    openArchived(); // Refresh the archived list
  } catch (e) {
    console.error('Error restoring research:', e);
    showNotification(e.message || 'Failed to restore research', 'error');
  }
}

// Event listener for View Archived button
document.addEventListener('DOMContentLoaded', function() {
  const viewArchivedBtn = document.getElementById('viewArchivedBtn');
  if (viewArchivedBtn) {
    viewArchivedBtn.addEventListener('click', openArchived);
  }
});

// Terms and Conditions Modal Functions
function openTermsModal() {
  const modal = document.getElementById('termsModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeTermsModal() {
  const modal = document.getElementById('termsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Toggle between student and admin fields
const userTypeRadios = document.getElementsByName('userType');
const studentFields = document.getElementById('studentFields');
const adminFields = document.getElementById('adminFields');

function updateFieldsVisibility() {
  // Check if elements exist before trying to access them
  if (!studentFields || !adminFields) {
    return; // Exit early if elements don't exist (e.g., on dashboard pages)
  }
  
  studentFields.style.display = 'none';
  adminFields.style.display = 'none';
  const roleRadio = document.querySelector('input[name="userType"]:checked');
  if (roleRadio) {
    const role = roleRadio.value;
    if (role === 'student') {
      studentFields.style.display = 'block';
    } else if (role === 'admin') {
      adminFields.style.display = 'block';
    }
  }
}

if (userTypeRadios && userTypeRadios.length > 0) {
  Array.from(userTypeRadios).forEach(radio => {
    radio.addEventListener('change', updateFieldsVisibility);
  });
  // Initial call to ensure correct fields are shown on page load
  updateFieldsVisibility();
}

// --- Search & View module department normalization --- //
function normalizeDept(name) {
  return String(name||'').replace(/\s*\([^)]*\)/, '').trim().toLowerCase();
}

async function loadTopAuthors() {
  console.log('loadTopAuthors called');
  const limit = document.getElementById('topAuthorsLimit')?.value || 10;
  const container = document.getElementById('topAuthorsList');
  console.log('Authors container found:', !!container);
  if (!container) {
    console.log('Authors container not found');
    return;
  }
  
  const token = localStorage.getItem('token');
  console.log('Token found:', !!token);
  if (!token) {
    container.innerHTML = '<div>Please log in to view statistics</div>';
    return;
  }
  
  try {
    console.log('Fetching top authors with limit:', limit);
    const response = await fetch(`${API_BASE_URL}/api/statistics/top-authors?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log('Top authors data:', data);
    container.innerHTML = data.map((item, idx) =>
      `<div class="stat-row"><span class="stat-rank">${idx+1}</span><span class="stat-label">${item.author}</span><span class="stat-value">${item.count}</span></div>`).join('');
  } catch (error) {
    console.error('Error loading top authors:', error);
    container.innerHTML = `<div>Error loading top authors: ${error.message}</div>`;
  }
}
async function loadTopKeywords() {
  console.log('loadTopKeywords called');
  const limit = document.getElementById('topKeywordsLimit')?.value || 10;
  const container = document.getElementById('topKeywordsList');
  console.log('Keywords container found:', !!container);
  if (!container) {
    console.log('Keywords container not found');
    return;
  }
  
  const token = localStorage.getItem('token');
  console.log('Token found:', !!token);
  if (!token) {
    container.innerHTML = '<div>Please log in to view statistics</div>';
    return;
  }
  
  try {
    console.log('Fetching top keywords with limit:', limit);
    const response = await fetch(`${API_BASE_URL}/api/statistics/top-keywords?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log('Top keywords data:', data);
    container.innerHTML = data.map((item, idx) =>
      `<div class="stat-row"><span class="stat-rank">${idx+1}</span><span class="stat-label">${item.keyword}</span><span class="stat-value">${item.count}</span></div>`).join('');
  } catch (error) {
    console.error('Error loading top keywords:', error);
    container.innerHTML = `<div>Error loading top keywords: ${error.message}</div>`;
  }
}
// Event listeners for dropdown changes
document.getElementById('topAuthorsLimit')?.addEventListener('change', loadTopAuthors);
document.getElementById('topKeywordsLimit')?.addEventListener('change', loadTopKeywords);

// Student Dashboard Search Functionality
function initializeStudentSearch() {
  const tags = [];
  const tagsEl = document.getElementById('searchTags');
  const inputEl = document.getElementById('searchInput');
  const deptEl = document.getElementById('filterDepartment');
  const yearEl = document.getElementById('filterYear');
  const semEl = document.getElementById('filterSemester');
  const btn = document.getElementById('doSearch');
  const grid = document.getElementById('resultsGrid');
  const loading = document.getElementById('searchLoading');
  const empty = document.getElementById('noResults');
  const pager = document.getElementById('pager');

  if (!inputEl || !grid) return; // Section not visible on this page

  // Populate years dropdown
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2000; y--) {
    const opt = document.createElement('option');
    opt.value = String(y); 
    opt.textContent = String(y);
    yearEl.appendChild(opt);
  }

  function renderTagList(){
    tagsEl.innerHTML = tags.map((t,i)=>`<span class="tag-chip">${t}<span class="remove" data-i="${i}">×</span></span>`).join('');
  }

  function addTag(raw){
    const val = String(raw||'').trim();
    if (!val) return;
    const norm = val.toLowerCase();
    if (tags.includes(norm)) return;
    tags.push(norm); 
    renderTagList();
  }

  tagsEl.addEventListener('click', (e)=>{
    const r = e.target.closest('.remove');
    if (r){ 
      const i = Number(r.getAttribute('data-i')); 
      tags.splice(i,1); 
      renderTagList(); 
    }
  });

  function addFromInput(){
    const raw = inputEl.value || '';
    if (!raw.trim()) return;
    raw.split(/[,\s]+/).forEach(tok=> addTag(tok));
    inputEl.value = '';
  }

  inputEl.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ',' || e.key === ' '){
      e.preventDefault(); 
      addFromInput(); 
      fetchPage(1);
    }
  });

  // Realtime: re-fetch after short debounce when typing
  let inputTimer;
  inputEl.addEventListener('input', ()=>{
    clearTimeout(inputTimer);
    inputTimer = setTimeout(()=>{ fetchPage(1); }, 300);
  });

  btn.addEventListener('click', ()=>{ addFromInput(); fetchPage(1); });

  async function fetchPage(page){
    loading.style.display = 'block'; 
    empty.style.display = 'none'; 
    grid.innerHTML=''; 
    pager.style.display='none';
    
    const params = new URLSearchParams({
      page: String(page||1),
      limit: '9'
    });
    
    if (deptEl.value) params.set('department', deptEl.value);
    if (yearEl.value) params.set('year', yearEl.value);
    if (semEl && semEl.value) params.set('semester', semEl.value);
    if (tags.length) params.set('qTags', tags.join(','));
    
    try{
      const url = `/api/research/search?${params.toString()}`;
      const res = await fetch(url, { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      const { data = [], pagination } = json;
      loading.style.display = 'none';
      
      if (!Array.isArray(data) || data.length === 0){ 
        empty.style.display='block'; 
        return; 
      }
      
      renderStudentCards(data);
      renderPager(pagination);
    }catch(err){
      console.error('Search error:', err);
      loading.style.display = 'none'; 
      empty.style.display='block';
    }
  }

  function renderStudentCards(items){
    grid.innerHTML = items.map(p => {
      const authors = (Array.isArray(p.authors) ? p.authors : String(p.authors||'').split(',')).filter(Boolean).map(a=>String(a).trim());
      const advisers = String(p.adviser || '').split(',').map(s=>s.trim()).filter(Boolean);
      const metaDept = p.department || '';
      const metaYear = p.year || '';
      const metaSem = p.semester || '';
      
      return `
      <div class="result-card">
        <h4>${p.title}</h4>
        <div class="meta-list">
          ${metaDept ? `<div class="meta-row"><i class="fas fa-building meta-icon"></i><span>${metaDept}</span></div>` : ''}
          ${metaYear ? `<div class="meta-row"><i class="fas fa-calendar-alt meta-icon"></i><span>${metaYear}</span></div>` : ''}
          ${metaSem ? `<div class="meta-row"><i class="fas fa-graduation-cap meta-icon"></i><span>${metaSem}</span></div>` : ''}
        </div>
        <div class="adviser-row"><i class="fas fa-user-tie row-icon"></i><div class="chips">${(advisers.length ? advisers : ['N/A']).map(n=>`<span class="adviser-chip">${n}</span>`).join(' ')}</div></div>
        <div class="author-row"><i class="fas fa-users row-icon"></i><div class="author-chips">${authors.map(a=>`<span class="author-chip">${a}</span>`).join(' ')}</div></div>
        ${p.pdfFilePath ? `<a class="btn btn-primary view-btn" href="${API_BASE_URL}/api/research/${p._id}/pdf" target="_blank" onclick="trackView('${p._id}')">View Research</a>` : ''}
      </div>`;
    }).join('');
  }

  function renderPager(p){
    if (!p || p.totalPages <= 1) { pager.style.display = 'none'; return; }
    pager.style.display = 'flex';
    pager.style.justifyContent = 'center';
    pager.style.flexWrap = 'wrap';
    pager.innerHTML = '';

    const maxPages = 5;
    let start = Math.max(1, p.page - 2);
    let end = start + maxPages - 1;
    if (end > p.totalPages) {
      end = p.totalPages;
      start = Math.max(1, end - maxPages + 1);
    }

    // Previous arrow
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&lt;';
    prevBtn.disabled = p.page === 1;
    if (p.page > 1) prevBtn.onclick = () => fetchPage(p.page - 1);
    prevBtn.classList.add('pager-arrow');
    pager.appendChild(prevBtn);

    // Page numbers
    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.textContent = String(i);
      if (i === p.page) btn.classList.add('active');
      btn.onclick = () => fetchPage(i);
      pager.appendChild(btn);
    }

    // Next arrow
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&gt;';
    nextBtn.disabled = p.page === p.totalPages;
    if (p.page < p.totalPages) nextBtn.onclick = () => fetchPage(p.page + 1);
    nextBtn.classList.add('pager-arrow');
    pager.appendChild(nextBtn);
  }

  // Initial search to show all research papers
  fetchPage(1);
}

// When dashboard loads, set profile info in settings (student)
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('profileName') && document.getElementById('profileDepartment')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('profileName').value = user.name || user.fullName || user.firstName + (user.lastName ? (' ' + user.lastName) : '') || '';
    document.getElementById('profileDepartment').value = user.department || '';
    document.getElementById('profileRole').value = user.role || '';
    // Use createdAt or memberSince or another reliable field
    const joinDate = user.createdAt || user.memberSince || '';
    document.getElementById('profileJoined').value = joinDate ? (new Date(joinDate)).toLocaleDateString() : '';
  }
  
  // Update student name in header (student dashboard)
  if (document.getElementById('studentName')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Format name: capitalize first letter, lowercase rest
    function formatName(name) {
      if (!name || typeof name !== 'string') return '';
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    
    let displayName = 'Student User';
    if (user.firstName && user.lastName) {
      displayName = formatName(user.firstName) + ' ' + formatName(user.lastName);
    } else if (user.firstName) {
      displayName = formatName(user.firstName);
    } else if (user.schoolId) {
      displayName = user.schoolId;
    }
    
    document.getElementById('studentName').textContent = displayName;
  }
});

// Student Profile: Statistics
async function loadStudentProfileStats() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.schoolId) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/research/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch your research uploads');
    const research = await res.json();
    document.getElementById('profileUploads').textContent = research.length;
    const totalViews = research.reduce((sum, r) => sum + (r.views || 0), 0);
    document.getElementById('profileViews').textContent = totalViews;
  } catch (err) {
    document.getElementById('profileUploads').textContent = '0';
    document.getElementById('profileViews').textContent = '0';
  }
}
// Attach this on settings section load as below:
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('profileUploads') && document.getElementById('profileViews')) {
    loadStudentProfileStats();
  }
});

// --- Change Password Modal Implementation ---
function showChangePasswordModal() {
  if (document.getElementById('changePwdModal')) {
    document.getElementById('changePwdModal').style.display = 'block';
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'changePwdModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3><i class="fas fa-key"></i> Change Password</h3>
        <button class="modal-close" onclick="this.closest('.modal').style.display='none';">&times;</button>
      </div>
      <form id="changePwdForm" class="modern-form">
        <div class="form-group">
          <label for="curPwd">Current Password</label>
          <input type="password" id="curPwd" required autocomplete="current-password">
        </div>
        <div class="form-group">
          <label for="newPwd">New Password</label>
          <input type="password" id="newPwd" required autocomplete="new-password">
        </div>
        <div class="form-group">
          <label for="confirmPwd">Confirm New Password</label>
          <input type="password" id="confirmPwd" required autocomplete="new-password">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Change Password</button>
          <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('changePwdModal').style.display='none';">Cancel</button>
        </div>
        <div id="changePwdErrorMsg" class="form-error" style="display:none;"></div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'block';

  modal.querySelector('#changePwdForm').addEventListener('submit', async function(e){
    e.preventDefault();
    const curPwd = modal.querySelector('#curPwd').value;
    const newPwd = modal.querySelector('#newPwd').value;
    const confirmPwd = modal.querySelector('#confirmPwd').value;
    const errorMsg = modal.querySelector('#changePwdErrorMsg');
    errorMsg.style.display = 'none';

    if (!curPwd || !newPwd || !confirmPwd) {
      errorMsg.textContent = 'All fields are required.'; errorMsg.style.display = '';
      return;
    }
    if (newPwd.length < 6) {
      errorMsg.textContent = 'New password must be at least 6 characters.'; errorMsg.style.display = '';
      return;
    }
    if (newPwd !== confirmPwd) {
      errorMsg.textContent = 'New passwords do not match.'; errorMsg.style.display = '';
      return;
    }
    // Call backend endpoint
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password change failed');
      modal.style.display = 'none';
      showNotification('Password successfully changed!', 'success');
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = '';
    }
  });
}
// Attach to button:
window.changePassword = showChangePasswordModal;

  // --- Analytics unified filter system ---
// Call this at page load on analytics page (admin-dashboard)
function initializeAnalyticsFilters() {
  const yearSel = document.getElementById('analyticsYearFilter');
  const semSel = document.getElementById('analyticsSemesterFilter');
  if (!yearSel || !semSel) return;

  fetch('/api/statistics/by-year', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
    .then(r => r.json())
    .then(years => {
      // Use _id or year property, descending by value
      const yearList = (years || []).map(y=>y._id).sort((a,b) => b-a);
      yearSel.innerHTML = '<option value="">All Years</option>' + yearList.map(y=>`<option value="${y}">${y}</option>`).join('');
      // Filters always default to empty string (All Years, All Semesters) - no persistence
    });

  // Filters default to empty string (All Semesters, All Years)

  yearSel.addEventListener('change', updateAllAnalytics);
  semSel.addEventListener('change', updateAllAnalytics);

  // Initial load
  updateAllAnalytics();
}

function updateAllAnalytics() {
  const year = document.getElementById('analyticsYearFilter').value;
  const semester = document.getElementById('analyticsSemesterFilter').value;

  // Fetch and update total research uploaded
  const params = [];
  if (year) params.push(`year=${encodeURIComponent(year)}`);
  if (semester) params.push(`semester=${encodeURIComponent(semester)}`);
  const query = params.length ? '?' + params.join('&') : '';
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  // Total count
  fetch(`/api/statistics/by-department${query}`, { headers })
    .then(r => r.json())
    .then(deps => {
      const totalCount = Array.isArray(deps) ? deps.reduce((sum, d) => sum + d.count, 0) : 0;
      const totalEl = document.getElementById('totalResearchPapers');
      if (totalEl) totalEl.textContent = totalCount;
      // Redraw department chart
      redrawDepartmentChart(deps);
    });

  // Adviser chart
  fetch(`/api/statistics/by-adviser${query}`, { headers })
    .then(r => r.json())
    .then(advs => {
      redrawAdviserChart(advs);
    });
}

function redrawDepartmentChart(depStats) {
  const ctx = document.getElementById('departmentChart');
  if (!ctx) return;
  if (window.departmentChartInstance) {
    window.departmentChartInstance.destroy();
  }
  const labels = depStats.map(d => d.department || d._id || 'Unknown');
  const values = depStats.map(d => d.count);
  const colors = depStats.map((_, i) => `hsl(${(i*67)%360} 70% 62%)`);

  // Use full names for chart labels, so tooltips show the full name
  window.departmentChartInstance = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });

  // Redraw legend with acronyms
  const legend = document.getElementById('departmentLegend');
  if (legend) {
    const departmentAcronymMap = {
      'Marine Engineering': 'BSME',
      'Marine Transportation': 'BSMT',
      'Criminology': 'BSCRIM',
      'Tourism Management': 'BSTM',
      'Technical-Vocational Teacher Education': 'BTVTED',
      'Early Childhood Education': 'EDUC',
      'Information System': 'BSIS',
      'Entrepreneurship': 'BSE',
      'Management Accounting': 'BSMA',
      'Nursing': 'BSN',
      'Humanities and Social Sciences': 'HUMSS',
      'Accountancy, Business and Management': 'ABM',
      'Science, Technology, Engineering and Mathematics': 'STEM',
      'General Academic Strand': 'GAS',
      'Other': 'Other'
    };
    const toAcr = (name) => {
      if (!name) return 'N/A';
      // Use strict match first
      if (departmentAcronymMap[name.trim()]) {
        return departmentAcronymMap[name.trim()];
      }
      // Try relaxed case-insensitive match
      const key = Object.keys(departmentAcronymMap).find(dep => dep.trim().toLowerCase()===name.trim().toLowerCase());
      if (key) return departmentAcronymMap[key];
      // Try substring match as fallback (partial name inside key)
      const partial = Object.keys(departmentAcronymMap).find(dep => name.toLowerCase().includes(dep.toLowerCase()));
      if (partial) return departmentAcronymMap[partial];
      // Fallback - parenthesis or initials
      const m = name.match(/\(([^)]+)\)/);
      if (m && m[1]) return m[1].trim();
      return name.replace(/[^A-Za-z\s]/g,' ').split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()).join('');
    };
    const total = values.reduce((a,b)=>a+b,0)||1;
    legend.innerHTML = '<h4>Departments</h4>' + labels.map((name,i)=> {
      const pct = Math.round(values[i]/total*100);
      return `<div class="dept-item"><span><span class="dot" style="background:${colors[i]}"></span>${toAcr(name)}</span><strong>${values[i]} (${pct}%)</strong></div>`;
    }).join('');
  }
}
function redrawAdviserChart(adviserStats) {
  const ctx = document.getElementById('adviserChart');
  if (!ctx) return;
  if (window.adviserChartInstance) {
    window.adviserChartInstance.destroy();
  }
  const labels = adviserStats.map(a => a.adviser || a._id || 'Unknown');
  const values = adviserStats.map(a => a.count);
  const colors = adviserStats.map((_,i) => `hsl(${(i*53)%360} 72% 66%)`);
  window.adviserChartInstance = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
  // Redraw legend if present
  const legend = document.getElementById('adviserLegend');
  if (legend) {
    const total = values.reduce((a,b)=>a+b,0)||1;
    legend.innerHTML = '<h4>Advisers</h4>' + labels.map((name,i)=> {
      const pct = Math.round(values[i]/total*100);
      return `<div class="dept-item"><span><span class="dot" style="background:${colors[i]}"></span>${name.toUpperCase()}</span><strong>${values[i]} (${pct}%)</strong></div>`;
    }).join('');
  }
}
// Export PDF uses unified filter
async function exportPdfReport() {
  const btn = document.getElementById('exportDataBtn');
  const loader = document.getElementById('exportDataLoading');
  const year = document.getElementById('analyticsYearFilter')?.value || '';
  const semester = document.getElementById('analyticsSemesterFilter')?.value || '';
  let query = '';
  if (year) query += `year=${encodeURIComponent(year)}`;
  if (semester) {
    if (query.length > 0) query += '&';
    query += `semester=${encodeURIComponent(semester)}`;
  }
  try {
    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    const token = localStorage.getItem('token');
    let url = `${API_BASE_URL}/api/statistics/export-pdf`;
    if (query.length > 0) url += `?${query}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to export PDF report');
    const blob = await response.blob();
    const dlUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    // Get Content-Disposition filename, fallback if not present
    let disposition = response.headers.get('Content-Disposition');
    let fname = 'Research_Statistics_Report.pdf';
    if (disposition && disposition.includes('filename=')) {
      fname = disposition.split('filename=')[1].replace(/["']/g, '');
    }
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(dlUrl);
    a.remove();
    alert('PDF report exported!');
  } catch (error) {
    alert('Failed to export PDF report: ' + (error.message || error));
  } finally {
    if (loader) loader.style.display = 'none';
    if (btn) btn.disabled = false;
  }
}
// Call on analytics page load
if (document.getElementById('analyticsYearFilter') && document.getElementById('analyticsSemesterFilter')) {
  initializeAnalyticsFilters();
}

// Dark Mode Toggle Functionality
function initDarkMode() {
  // Check localStorage for dark mode preference
  const darkModeToggle = document.getElementById('darkModeToggle');
  
  if (darkModeToggle) {
    // Get saved preference from localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Set initial state
    darkModeToggle.checked = isDarkMode;
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Add event listener for toggle changes
    darkModeToggle.addEventListener('change', function() {
      const isDark = this.checked;
      const theme = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('darkMode', isDark);
      
      // Add smooth transition
      document.body.style.transition = 'all 0.3s ease';
      
      console.log('Dark mode toggled:', isDark);
    });
  }
}

// Initialize dark mode when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.info-tooltip').forEach(function(tt) {
    var icon = tt.querySelector('i');
    var tip = tt.querySelector('.tooltip-text');
    if (!icon || !tip) return;
    var show = () => { tip.style.display = 'block'; tip.style.opacity = '1'; };
    var hide = () => { tip.style.display = 'none'; tip.style.opacity = '0'; };
    icon.addEventListener('mouseenter', show);
    icon.addEventListener('mouseleave', hide);
    icon.addEventListener('focus', show);
    icon.addEventListener('blur', hide);
    // Touch accessibility for mobile
    icon.addEventListener('touchstart', function(e){ show(); e.stopPropagation(); });
    document.body.addEventListener('touchstart', function(){ hide(); });
  });
});

// Admin creation form submission (modal in admin-dashboard.html)
// Skip this handler on admin-dashboard.html (it has its own handler)
const createAdminForm = document.getElementById('createAdminForm');
if (createAdminForm && !window.location.pathname.includes('admin-dashboard.html')) {
  createAdminForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminPassword2').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    // Ensure all required fields are filled out (favoriteColor is optional)
    const favoriteColorValue = document.getElementById('adminFavoriteColor')?.value.trim() || '';
    const formData = {
      firstName: document.getElementById('adminFirstName').value.trim(),
      lastName: document.getElementById('adminLastName').value.trim(),
      username: document.getElementById('adminUsername').value.trim(),
      password: password,
      favoriteColor: favoriteColorValue || undefined
    };
    if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
      alert('All required fields must be filled.');
      return;
    }
    await createAdmin(formData);
  });
}

function openChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'block';
    // Reset form and messages
    const form = document.getElementById('adminChangePasswordForm');
    if (form) {
      form.reset();
      const errorDiv = form.querySelector('.form-error');
      if (errorDiv) errorDiv.style.display = 'none';
      const successDiv = form.querySelector('.form-success');
      if (successDiv) successDiv.style.display = 'none';
    }
  }
}
function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) {
    modal.style.display = 'none';
    const form = document.getElementById('adminChangePasswordForm');
    if (form) {
      form.reset();
      const errorDiv = form.querySelector('.form-error');
      if (errorDiv) errorDiv.style.display = 'none';
      const successDiv = form.querySelector('.form-success');
      if (successDiv) successDiv.style.display = 'none';
    }
  }
}
// Register modal button event on DOMContentLoaded
// ... existing code ...
document.addEventListener('DOMContentLoaded', function() {
  // ... existing code ...
  const openPwdBtn = document.getElementById('openChangePasswordModalBtn');
  if (openPwdBtn) openPwdBtn.addEventListener('click', openChangePasswordModal);
  // Bind form only once inside modal
  const adminChangePasswordForm = document.getElementById('adminChangePasswordForm');
  if (adminChangePasswordForm) {
    adminChangePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      // ... [logic unchanged] ...
      const currentPassword = document.getElementById('adminCurrentPassword').value.trim();
      const newPassword = document.getElementById('adminNewPassword').value.trim();
      const confirmNewPassword = document.getElementById('adminConfirmNewPassword').value.trim();
      const errorDiv = adminChangePasswordForm.querySelector('.form-error');
      const successDiv = adminChangePasswordForm.querySelector('.form-success');
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        errorDiv.textContent = 'Please fill in all fields.';
        errorDiv.style.display = 'block';
        return;
      }
      if (newPassword.length < 6) {
        errorDiv.textContent = 'New password must be at least 6 characters.';
        errorDiv.style.display = 'block';
        return;
      }
      if (newPassword !== confirmNewPassword) {
        errorDiv.textContent = 'New passwords do not match.';
        errorDiv.style.display = 'block';
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update password');
        }
        successDiv.textContent = 'Password updated successfully.';
        successDiv.style.display = 'block';
        adminChangePasswordForm.reset();
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
    });
  }
});
// ... existing code ...

function togglePasswordVisibility(e) {
  const btn = e.currentTarget;
  const inputId = btn.getAttribute('data-target');
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
      btn.querySelector('i').classList.remove('fa-eye');
      btn.querySelector('i').classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      btn.querySelector('i').classList.remove('fa-eye-slash');
      btn.querySelector('i').classList.add('fa-eye');
    }
  }
}
function attachPasswordToggleListeners(scope) {
  (scope ? scope.querySelectorAll('.toggle-password-visibility') : document.querySelectorAll('.toggle-password-visibility')).forEach(btn => {
    btn.removeEventListener('click', togglePasswordVisibility); // Avoid duplicates
    btn.addEventListener('click', togglePasswordVisibility);
  });
}
document.addEventListener('DOMContentLoaded', function() {
  // ...existing code...
  attachPasswordToggleListeners();
  // Add to modals when opened too
  const openPwdBtn = document.getElementById('openChangePasswordModalBtn');
  if (openPwdBtn) {
    openPwdBtn.addEventListener('click', function(){
      openChangePasswordModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('changePasswordModal')), 50);
    });
  }
  const openCreateAdminBtn = document.querySelector('[onclick="openCreateAdminModal()"]');
  if (openCreateAdminBtn) {
    openCreateAdminBtn.addEventListener('click', function(){
      openCreateAdminModal();
      setTimeout(() => attachPasswordToggleListeners(document.getElementById('createAdminModal')), 50);
    });
  }
});
// ... existing code ...
