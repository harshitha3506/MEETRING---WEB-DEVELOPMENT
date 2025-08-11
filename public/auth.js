// Tab switching logic
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');

// Switch to Login tab
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    authMessage.textContent = '';
    authMessage.style.color = ''; // Reset color
});

// Switch to Signup tab
signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    authMessage.textContent = '';
    authMessage.style.color = ''; // Reset color
});

// Helper to POST data to server
async function postData(url, data) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error posting data:', error);
        return { message: 'Server error. Please try again later.' };
    }
}

// Login handler
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        authMessage.style.color = '#b91c1c';
        authMessage.textContent = 'Please enter both email and password.';
        return;
    }

    const result = await postData('/api/login', { email, password });

    if (result.message === 'Login successful.') {
        window.location.href = 'index.html';
    } else {
        authMessage.style.color = '#b91c1c';
        authMessage.textContent = result.message || 'Login failed.';
    }
});

// Signup handler
signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirm = document.getElementById('signupConfirm').value.trim();

    if (!email || !password || !confirm) {
        authMessage.style.color = '#b91c1c';
        authMessage.textContent = 'Please fill in all fields.';
        return;
    }

    if (password !== confirm) {
        authMessage.style.color = '#b91c1c';
        authMessage.textContent = 'Passwords do not match.';
        return;
    }

    const result = await postData('/api/signup', { email, password });

    if (result.message === 'Signup successful.') {
        authMessage.style.color = '#16a34a';
        authMessage.textContent = 'Signup successful! Please login.';
        signupForm.reset();
        // Switch to login tab automatically
        loginTab.click();
    } else {
        authMessage.style.color = '#b91c1c';
        authMessage.textContent = result.message || 'Signup failed.';
    }
});
