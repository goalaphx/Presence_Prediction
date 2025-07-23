// src/services/apiService.js

const API_BASE_URL = 'http://predict-api.test/api'; // Your Laravel API URL

// Helper function to handle API responses
async function handleResponse(response) {
    if (!response.ok) {
        // Try to get a specific message from the server's JSON response
        const errorData = await response.json().catch(() => ({})); // Catch if the response isn't valid JSON
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// === EXISTING API FUNCTIONS ===

export const getMeetings = async () => {
    const response = await fetch(`${API_BASE_URL}/meetings`);
    return handleResponse(response);
};

export const getPredictionsForMeeting = async (meetingId) => {
    if (!meetingId) return []; // Don't fetch if no meeting is selected
    const response = await fetch(`${API_BASE_URL}/predict/meeting/${meetingId}`);
    return handleResponse(response);
};

export const getUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`); 
    return handleResponse(response);
};

export const getUserStats = async (userId) => {
    if (!userId) return null;
    const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
    return handleResponse(response);
};

export const getUserMeetingPerformance = async (userId) => {
    if (!userId) return [];
    const response = await fetch(`${API_BASE_URL}/users/${userId}/meeting-performance`);
    return handleResponse(response);
};


// === NEW API FUNCTIONS (Corrected for Fetch) ===

export const getSystemOverview = async () => {
    const response = await fetch(`${API_BASE_URL}/stats/overview`);
    return handleResponse(response);
};

// In src/services/apiService.js

export const getAtRiskStudents = async (threshold, minMeetings) => {
    // Construct the URL with both query parameters
    const response = await fetch(`${API_BASE_URL}/analytics/students/at-risk?threshold=${threshold}&minMeetings=${minMeetings}`);
    return handleResponse(response);
};

export const retrainModel = async () => {
    // Use POST for actions that change server state
    const response = await fetch(`${API_BASE_URL}/model/retrain`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    return handleResponse(response);
};