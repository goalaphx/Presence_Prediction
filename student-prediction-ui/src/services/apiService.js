// src/services/apiService.js

const API_BASE_URL = 'http://predict-api.test/api'; // Your Laravel API URL

// Helper function to handle API responses
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
}

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