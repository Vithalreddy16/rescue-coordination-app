document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the HTML elements we need
    const issueForm = document.getElementById('issue-form');
    const getLocationBtn = document.getElementById('get-location');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const formMessage = document.getElementById('form-message');
    
    // Define the backend API URL
    const API_URL = 'http://localhost:5000/api/issues';

    // --- Event Listener for the "Use My GPS" button ---
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            // Ask the browser for the user's current position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success: Fill the input fields with the coordinates
                    latInput.value = position.coords.latitude;
                    lonInput.value = position.coords.longitude;
                    formMessage.innerHTML = '<div class="alert alert-info">GPS location captured!</div>';
                }, 
                () => {
                    // Error: Show an alert if something went wrong
                    alert('Unable to retrieve your location. Please enter it manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });

    // --- Event Listener for the form submission ---
    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission which reloads the page
        formMessage.innerHTML = ''; // Clear any previous messages

        // Collect all the data from the form fields
        const formData = {
            userName: document.getElementById('name').value,
            userPhone: document.getElementById('phone').value,
            userEmail: document.getElementById('email').value,
            description: document.getElementById('description').value,
            latitude: latInput.value,
            longitude: lonInput.value,
        };

        try {
            // Send the data to the backend using the fetch API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json(); // Parse the JSON response from the server

            if (response.ok) {
                // If the server responds with a 2xx status code (e.g., 201)
                formMessage.innerHTML = `<div class="alert alert-success">${data.msg}</div>`;
                issueForm.reset(); // Clear the form fields
            } else {
                // If the server responds with an error (e.g., 400 for validation)
                const errorMsg = data.errors ? data.errors.map(err => err.msg).join('<br>') : 'An unknown error occurred.';
                formMessage.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            }
        } catch (error) {
            // If the fetch itself fails (e.g., server is not running)
            console.error('Error submitting form:', error);
            formMessage.innerHTML = `<div class="alert alert-danger">Could not connect to the server. Please try again later.</div>`;
        }
    });
});