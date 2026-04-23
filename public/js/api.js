// API Configuration - CHANGE THIS URL AFTER BACKEND DEPLOYMENT
const API_BASE_URL = 'https://attendance-backend-dbfp.onrender.com'; // Will change later

async function apiCall(endpoint, method = 'GET', data = null) {
    const url = API_BASE_URL + endpoint;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    return response.json();
}

// Make available globally
window.apiCall = apiCall;
window.API_BASE_URL = API_BASE_URL;
