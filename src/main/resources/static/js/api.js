export const API_BASE = '';

export async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(API_BASE + endpoint, options);
    if (!response.ok) {
        // Пытаемся извлечь сообщение из JSON-ответа
        let errorMessage = `Ошибка ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            }
        } catch (e) {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
}

export async function registerUser(email, username, password) {
    return apiRequest('/register', 'POST', { email, username, password });
}

export async function loginUser(email, password) {
    const data = await apiRequest('/login', 'POST', { email, password });
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('uuid', data.uuid);
        localStorage.setItem('username', data.username);
        localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

export async function fetchAllUsers() {
    return apiRequest('/profile/all');
}

export async function searchUsers(query) {
    return apiRequest(`/profile/search?query=${encodeURIComponent(query)}`);
}

export async function fetchProfile(uuid) {
    return apiRequest(`/profile/${uuid}`);
}

export async function updateProfile(uuid, data) {
    return apiRequest(`/profile/${uuid}`, 'PUT', data);
}

export async function uploadAvatar(uuid, file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(API_BASE + `/profile/${uuid}/upload-image`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
    }
    return response.text(); // возвращает сообщение, например, путь к картинке
}

export async function getChatHistory(user1, user2) {
    return apiRequest(`/messages/${user1}/${user2}`);
}