
let ws = null;
let currentUser = {
    uuid: localStorage.getItem('uuid'),
    username: localStorage.getItem('username'),
    token: localStorage.getItem('token')
};
let selectedUser = null; // { uuid, username }
let allUsers = [];


if (!currentUser.token) {
    window.location.href = 'login.html';
}


document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    connectWebSocket();
    setupEventListeners();
});

function loadUsers() {
    fetch('/profile/all', {
        headers: { 'Authorization': 'Bearer ' + currentUser.token }
    })
        .then(res => {
            if (!res.ok) throw new Error('Unauthorized');
            return res.json();
        })
        .then(users => {
            allUsers = users.filter(u => u.uuid !== currentUser.uuid);
            renderUsers(allUsers);
        })
        .catch(err => {
            console.error('Ошибка загрузки пользователей:', err);
            if (err.message === 'Unauthorized') {
                logout();
            }
        });
}

function renderUsers(users) {
    const container = document.getElementById('usersList');
    container.innerHTML = '';
    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-item';
        if (selectedUser && selectedUser.uuid === u.uuid) {
            div.classList.add('active');
        }
        div.innerHTML = `
            <div class="username">${u.username}</div>
            <span class="status ${u.lastSeenAt ? 'offline' : 'online'}"></span>
        `;
        div.addEventListener('click', () => selectUser(u));
        container.appendChild(div);
    });
}

let lastMessages = [];

function isDuplicate(msg) {
    return lastMessages.some(m =>
        m.text === msg.text &&
        Math.abs(new Date(m.timestamp) - new Date(msg.timestamp)) < 2000
    );
}

function addMessageToHistory(msg, isMine) {
    if (isDuplicate(msg)) {
        console.log('Дубль, пропускаем');
        return;
    }
    lastMessages.push(msg);
    if (lastMessages.length > 10) lastMessages.shift();
    appendMessage(msg, isMine);
}

function selectUser(user) {
    selectedUser = user;
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    const items = document.querySelectorAll('.user-item');
    for (let el of items) {
        if (el.textContent.trim() === user.username) {
            el.classList.add('active');
            break;
        }
    }
    document.getElementById('chatHeader').textContent = `Чат с ${user.username}`;
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    loadHistory(user.uuid);
}

function loadHistory(otherUuid) {
    fetch(`/messages/${currentUser.uuid}/${otherUuid}`, {
        headers: { 'Authorization': 'Bearer ' + currentUser.token }
    })
        .then(res => res.json())
        .then(messages => {
            const container = document.getElementById('messages');
            container.innerHTML = '';
            messages.forEach(msg => {
                appendMessage(msg, false);
            });
            container.scrollTop = container.scrollHeight;
        })
        .catch(console.error);
}

function appendMessage(msg, isMine) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'sent' : 'received'}`;
    const time = new Date(msg.timestamp).toLocaleTimeString();
    div.innerHTML = `
        <span>${msg.text}</span>
        <span class="time">${time}</span>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function connectWebSocket() {
    const wsUrl = `ws://localhost:8080/ws?user_uuid=${currentUser.uuid}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket подключён');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.senderUuid === currentUser.uuid || data.receiverUuid === currentUser.uuid) {
            const other = data.senderUuid === currentUser.uuid ? data.receiverUuid : data.senderUuid;
            if (selectedUser && selectedUser.uuid === other) {
                const isMine = data.senderUuid === currentUser.uuid;
                addMessageToHistory(data, isMine);
            } else {
                console.log('Новое сообщение от', data.senderUsername);
            }
        }
    };

    ws.onclose = () => {
        console.log('WebSocket закрыт, переподключение через 3 сек...');
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (err) => {
        console.error('WebSocket ошибка:', err);
        ws.close();
    };
}

function sendMessage() {
    if (!selectedUser) {
        alert('Выберите собеседника');
        return;
    }
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    const payload = {
        senderUuid: currentUser.uuid,
        receiverUuid: selectedUser.uuid,
        text: text
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        input.value = '';
    } else {
        alert('WebSocket не подключён');
    }
}

function setupEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function logout() {
    localStorage.clear();
    if (ws) ws.close();
    window.location.href = 'login.html';
}