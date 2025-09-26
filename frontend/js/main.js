document.addEventListener('DOMContentLoaded', () => {
    // --- PART 1: MAIN ISSUE SUBMISSION FORM LOGIC ---

    const issueForm = document.getElementById('issue-form');
    // Only run this part of the code if the main form exists on the page
    if (issueForm) {
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
                // LIVE RENDER URL for submitting issues
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
    }


    // --- PART 2: RULE-BASED CHATBOT LOGIC ---

    const chatbotIcon = document.getElementById('chatbot-icon');
    // Only run this part if the chatbot elements exist on the page
    if (chatbotIcon) {
        const chatWindow = document.getElementById('chat-window');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const messagesContainer = document.getElementById('chat-messages');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        
        // LIVE RENDER URL for the chatbot
        const API_CHAT_URL = 'https://rescue-coordination-app.onrender.com/api/chat';

        chatbotIcon.addEventListener('click', () => { chatWindow.style.display = 'flex'; });
        closeChatBtn.addEventListener('click', () => { chatWindow.style.display = 'none'; });

        const addMessage = (message, sender) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = message;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            addMessage(userMessage, 'user');
            chatInput.value = '';
            
            setTimeout(async () => {
                try {
                    const res = await fetch(API_CHAT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: userMessage })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'An error occurred.');
                    
                    addMessage(data.reply || data.response, 'bot');

                } catch (error) {
                    addMessage('Sorry, something went wrong. Please try again.', 'bot');
                }
            }, 500);
        });

        // Initial greeting
        setTimeout(() => {
            addMessage("Hello! I am the Rescue Assistant. How can I help?", 'bot');
        }, 500);
    }
});
