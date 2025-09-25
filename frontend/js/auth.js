document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginCard = document.getElementById('login-card');
    const registerCard = document.getElementById('register-card');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    
    // --- Map and Location Logic ---
    const mapElement = document.getElementById('map');
    if (mapElement) {
        const latInput = document.getElementById('latitude');
        const lonInput = document.getElementById('longitude');
        const liveLocationBtn = document.getElementById('get-live-location-btn');
        let marker = null;
        const map = L.map('map').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        const updateLocation = (lat, lng, zoomLevel = 13) => {
            latInput.value = lat.toFixed(6);
            lonInput.value = lng.toFixed(6);
            const latLng = [lat, lng];
            if (marker) {
                marker.setLatLng(latLng);
            } else {
                marker = L.marker(latLng).addTo(map);
            }
            map.setView(latLng, zoomLevel);
        };
        map.on('click', (e) => updateLocation(e.latlng.lat, e.latlng.lng));
        liveLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => updateLocation(position.coords.latitude, position.coords.longitude),
                    () => alert('Could not get your location. Please click on the map manually.')
                );
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        });
    }

    const API_BASE_URL = 'https://rescue-coordination-app.onrender.com';

    // --- Toggle Forms ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
    });

    // --- Login Form Submission ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Login failed');
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } catch (err) {
            loginMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    });

    // --- Registration Form Submission ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // VALIDATION: Ensure location is selected
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        if (!latitude || !longitude) {
            alert('Please select a location on the map before registering.');
            return; 
        }

        const formData = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            phone: document.getElementById('register-phone').value,
            password: document.getElementById('register-password').value,
            latitude: latitude,
            longitude: longitude,
        };
        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) {
                const errorMsg = data.errors ? data.errors.map(err => err.msg).join('<br>') : (data.msg || 'Registration failed');
                throw new Error(errorMsg);
            }
            localStorage.setItem('token', data.token);
            window.location.href = 'dashboard.html';
        } catch (err) {
            registerMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    });
});
