document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'agency-login.html';
        return;
    }

    const agencyNameEl = document.getElementById('agency-name');
    const agencyEmailEl = document.getElementById('agency-email');
    const alertsListEl = document.getElementById('alerts-list');
    const alertsCountEl = document.getElementById('alerts-count');
    const collabRequestsListEl = document.getElementById('collab-requests-list');
    const collabCountEl = document.getElementById('collab-count');
    const myAcceptedIssuesListEl = document.getElementById('my-accepted-issues-list');
    const logoutBtn = document.getElementById('logout-btn');
    const collabModalEl = new bootstrap.Modal(document.getElementById('collabModal'));
    const collabForm = document.getElementById('collab-form');
    const agencySelectEl = document.getElementById('agency-select');
    const collabIssueIdInput = document.getElementById('collab-issue-id');
    const profileUpdateForm = document.getElementById('profile-update-form');
    const profileUpdateMessage = document.getElementById('profile-update-message');

    // UPDATED URLs
    const RENDER_URL = 'https://rescue-coordination-app.onrender.com';
    const API_BASE_URL = `${RENDER_URL}/api`;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    let profileMap = null;

    // WebSocket Connection (UPDATED URL)
    const socket = io(RENDER_URL, { auth: { token } });
    socket.on('connect', () => console.log('Connected to WebSocket server!', socket.id));
    socket.on('newIssueAlert', (issue) => {
        alert('🔔 New Emergency Alert Received!');
        addAlertToList(issue, true);
    });
    socket.on('issueAcceptedUpdate', (data) => {
        const acceptedElement = document.getElementById(`issue-${data.issueId}`);
        if (acceptedElement) {
            acceptedElement.remove();
            alertsCountEl.textContent = Math.max(0, parseInt(alertsCountEl.textContent) - 1);
        }
    });
    
    const loadDashboardData = async () => {
        try {
            const [profileRes, alertsRes, collabRes, myIssuesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/agencies/me`, { headers }),
                fetch(`${API_BASE_URL}/agencies/alerts`, { headers }),
                fetch(`${API_BASE_URL}/agencies/collaborate/requests`, { headers }),
                fetch(`${API_BASE_URL}/issues/me`, { headers })
            ]);
            if ([profileRes, alertsRes, collabRes, myIssuesRes].some(res => res.status === 401)) {
                localStorage.removeItem('token');
                window.location.href = 'agency-login.html';
                return;
            }
            const profile = await profileRes.json();
            const alerts = await alertsRes.json();
            const collabRequests = await collabRes.json();
            const myIssues = await myIssuesRes.json();
            
            agencyNameEl.textContent = profile.name;
            agencyEmailEl.textContent = profile.email;

            renderAlerts(alerts);
            renderCollaborationRequests(collabRequests);
            renderMyAcceptedIssues(myIssues);
            populateProfileForm(profile);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            alert('Could not load dashboard data.');
        }
    };

    const populateProfileForm = (profile) => {
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-phone').value = profile.phone || '';
        document.getElementById('profile-expertise').value = profile.expertise ? profile.expertise.join(', ') : '';
        document.getElementById('profile-region').value = profile.serviceRegion || '';
        
        const latInput = document.getElementById('profile-latitude');
        const lonInput = document.getElementById('profile-longitude');
        const [lon, lat] = profile.location.coordinates;
        latInput.value = lat;
        lonInput.value = lon;

        if (!profileMap) {
            profileMap = L.map('profile-map').setView([lat, lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(profileMap);
            let marker = L.marker([lat, lon]).addTo(profileMap);
            profileMap.on('click', (e) => {
                const { lat, lng } = e.latlng;
                latInput.value = lat.toFixed(6);
                lonInput.value = lng.toFixed(6);
                marker.setLatLng([lat, lng]);
            });
        }
    };

    const renderAlerts = (alerts) => {
        alertsListEl.innerHTML = '';
        alertsCountEl.textContent = alerts.length;
        if (alerts.length === 0) {
            alertsListEl.innerHTML = '<p class="text-center text-muted mt-3">No new alerts.</p>';
            return;
        }
        alerts.forEach(alert => addAlertToList(alert, false));
    };

    const addAlertToList = (alert, isRealtime = true) => {
        const noAlertsMsg = alertsListEl.querySelector('p');
        if (noAlertsMsg) noAlertsMsg.remove();
        const el = document.createElement('div');
        el.className = `list-group-item ${isRealtime ? 'list-group-item-warning' : ''}`;
        el.id = `issue-${alert._id}`;
        el.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${isRealtime ? '⚡ REAL-TIME ALERT ⚡' : 'New Emergency Report'}</h5>
                <small>${new Date(alert.createdAt).toLocaleString()}</small>
            </div>
            <p class="mb-1"><strong>Description:</strong> ${alert.description}</p>
            <p class="mb-1"><strong>Contact:</strong> ${alert.userName} (${alert.userPhone})</p>
            <div class="mt-2">
                <button class="btn btn-success btn-sm" onclick="acceptIssue('${alert._id}')">Accept</button>
                <button class="btn btn-secondary btn-sm" onclick="rejectIssue('${alert._id}')">Reject</button>
            </div>
        `;
        if (isRealtime) {
            alertsListEl.prepend(el);
            alertsCountEl.textContent = parseInt(alertsCountEl.textContent) + 1;
        } else {
            alertsListEl.appendChild(el);
        }
    };
    
    const renderCollaborationRequests = (requests) => {
        collabRequestsListEl.innerHTML = '';
        collabCountEl.textContent = requests.length;
        if (requests.length === 0) {
            collabRequestsListEl.innerHTML = '<p class="text-muted">No incoming requests.</p>'; return;
        }
        requests.forEach(req => {
            const el = document.createElement('div');
            el.className = 'list-group-item';
            el.innerHTML = `<p>From: <strong>${req.requestingAgency.name}</strong> for issue: "${req.issue.description}"</p><p><em>"${req.message}"</em></p>
                <div><button class="btn btn-primary btn-sm" onclick="respondToCollab('${req._id}', 'Accepted')">Accept</button>
                     <button class="btn btn-secondary btn-sm" onclick="respondToCollab('${req._id}', 'Rejected')">Reject</button></div>`;
            collabRequestsListEl.appendChild(el);
        });
    };
    
    const renderMyAcceptedIssues = (issues) => {
        myAcceptedIssuesListEl.innerHTML = '';
        if (issues.length === 0) {
            myAcceptedIssuesListEl.innerHTML = '<p class="text-muted">You have not accepted any issues yet.</p>'; return;
        }
        issues.forEach(issue => {
            const el = document.createElement('a');
            el.href = '#';
            el.className = 'list-group-item list-group-item-action';
            el.innerHTML = `<strong>Issue:</strong> ${issue.description}<span class="float-end"><button class="btn btn-info btn-sm" onclick="openCollabModal('${issue._id}')">Request Help</button></span>`;
            myAcceptedIssuesListEl.appendChild(el);
        });
    };

    logoutBtn.addEventListener('click', () => { localStorage.removeItem('token'); window.location.href = 'agency-login.html'; });

    profileUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileUpdateMessage.innerHTML = '';
        const updatedData = {
            name: document.getElementById('profile-name').value,
            phone: document.getElementById('profile-phone').value,
            expertise: document.getElementById('profile-expertise').value,
            serviceRegion: document.getElementById('profile-region').value,
            latitude: document.getElementById('profile-latitude').value,
            longitude: document.getElementById('profile-longitude').value,
        };
        try {
            const res = await fetch(`${API_BASE_URL}/agencies/me`, { method: 'PUT', headers, body: JSON.stringify(updatedData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to update profile.');
            profileUpdateMessage.innerHTML = '<div class="alert alert-success">Profile updated successfully!</div>';
            agencyNameEl.textContent = data.name;
        } catch (error) {
            profileUpdateMessage.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    });

    window.acceptIssue = async (issueId) => {
        if (!confirm('Are you sure you want to accept this issue?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/agencies/issues/${issueId}/accept`, { method: 'POST', headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg);
            alert('Success! Issue accepted.');
            loadDashboardData();
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
        }
    };
    
    window.rejectIssue = async (issueId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/agencies/issues/${issueId}/reject`, { method: 'POST', headers });
            if (!res.ok) throw new Error('Failed to reject issue.');
            const rejectedElement = document.getElementById(`issue-${issueId}`);
            if (rejectedElement) rejectedElement.remove();
            alertsCountEl.textContent = Math.max(0, parseInt(alertsCountEl.textContent) - 1);
        } catch (error) {
            alert('Could not dismiss the alert.');
        }
    };

    window.openCollabModal = async (issueId) => {
        collabIssueIdInput.value = issueId;
        const res = await fetch(`${API_BASE_URL}/agencies`, { headers });
        const agencies = await res.json();
        agencySelectEl.innerHTML = '<option selected disabled value="">Choose an agency...</option>';
        agencies.forEach(agency => {
            agencySelectEl.innerHTML += `<option value="${agency._id}">${agency.name}</option>`;
        });
        collabModalEl.show();
    };
    
    collabForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = { requestedAgencyId: agencySelectEl.value, issueId: collabIssueIdInput.value, message: document.getElementById('collab-message').value };
        await fetch(`${API_BASE_URL}/agencies/collaborate`, { method: 'POST', headers, body: JSON.stringify(body) });
        collabModalEl.hide();
        collabForm.reset();
        alert('Collaboration request sent!');
    });

    window.respondToCollab = async (requestId, response) => {
        await fetch(`${API_BASE_URL}/agencies/collaborate/requests/${requestId}`, { method: 'POST', headers, body: JSON.stringify({ response }) });
        loadDashboardData();
    };

    loadDashboardData();
});
