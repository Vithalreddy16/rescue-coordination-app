document.addEventListener('DOMContentLoaded', () => {
    const issueForm = document.getElementById('issue-form');
    const getLocationBtn = document.getElementById('get-location');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const formMessage = document.getElementById('form-message');

    // Get location via GPS
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                latInput.value = position.coords.latitude;
                lonInput.value = position.coords.longitude;
            }, () => {
                alert('Unable to retrieve your location.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });

    // Handle form submission
    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            userName: document.getElementById('name').value,
            userPhone: document.getElementById('phone').value,
            userEmail: document.getElementById('email').value,
            description: document.getElementById('description').value,
            latitude: latInput.value,
            longitude: lonInput.value,
        };

        try {
            // UPDATED URL
            const response = await fetch('https://rescue-coordination-app.onrender.com/api/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                formMessage.innerHTML = `<div class="alert alert-success">${data.msg}</div>`;
                issueForm.reset();
            } else {
                const errorMsg = data.errors ? data.errors.map(e => e.msg).join('<br>') : 'An error occurred.';
                formMessage.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            formMessage.innerHTML = `<div class="alert alert-danger">Could not connect to the server.</div>`;
        }
    });
});
