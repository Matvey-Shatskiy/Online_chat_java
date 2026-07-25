window.openMyProfile = openMyProfile;
window.openUserProfile = openUserProfile;
window.closeProfileModal = closeProfileModal;
window.handleLogout = handleLogout;
window.uploadMyAvatar = uploadMyAvatar;
window.saveMyProfile = saveMyProfile;

let currentUserUuid = localStorage.getItem('uuid');
let currentUsername = localStorage.getItem('username');
let token = localStorage.getItem('token');
let activeChatUser = null;
let ws = null;
let currentPage = 0;
let totalPages = 1;
let isLoadingUsers = false;

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='20' fill='%233c4f6f'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-size='18'>👤</text></svg>";

if (!token || !currentUserUuid) {
    window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    connectWebSocket();
    loadAllUsers();
    setupEventListeners();
}

async function loadAllUsers(page = 0, append = false) {
    if (isLoadingUsers) return;
    isLoadingUsers = true;

    try {
        const usernameLike = document.getElementById('search-input').value.trim();
        // Передаем параметры page и size=20 в Spring
        const response = await fetch(`/api/users?userUuid=${currentUserUuid}&usernameLike=${usernameLike}&page=${page}&size=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Ошибка загрузки пользователей');

        const data = await response.json();

        // Если с бэкенда пришел объект Page из Spring
        if (data.content) {
            currentPage = data.number;      // текущий номер страницы (начиная с 0)
            totalPages = data.totalPages;  // всего страниц
            renderUsersList(data.content, append);
        } else {
            renderUsersList(data, append);
        }
    } catch (err) {
        console.error('Ошибка загрузки пользователей:', err);
    } finally {
        isLoadingUsers = false;
    }
}

function renderUsersList(users, append = false) {
    const userListContainer = document.getElementById('user-list');
    if (!userListContainer) return;

    // Очищаем список только если это первая загрузка (не подгрузка при скролле)
    if (!append) {
        userListContainer.innerHTML = '';
    }

    if (users.length === 0 && !append) {
        userListContainer.innerHTML = '<div style="padding: 15px; color: #888;">Нет других пользователей</div>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.setAttribute('data-uuid', user.uuid);

        const isOnline = user.isOnline !== undefined ? user.isOnline : (user.online || false);
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusText = isOnline ? 'В сети' : 'Не в сети';
        const avatarSrc = user.userImage || DEFAULT_AVATAR;

        item.innerHTML = `
            <div class="avatar" style="position: relative;" onclick="event.stopPropagation(); openUserProfile('${user.username}')">
                <img src="${avatarSrc}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onError="this.onerror=null; this.src='${DEFAULT_AVATAR}';" />
                <span class="status-badge ${statusClass}"></span>
            </div>
            <div class="info" style="margin-left: 10px; flex-grow: 1;">
                <div class="name" style="font-weight: bold;">${user.username}</div>
                <div class="user-item-status" style="font-size: 12px; color: ${isOnline ? '#2ec4b6' : '#888'};">${statusText}</div>
            </div>
        `;

        item.onclick = () => selectUserForChat(user);
        userListContainer.appendChild(item);
    });
}
function selectUserForChat(user) {
    activeChatUser = user;

    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    const selectedEl = document.querySelector(`[data-uuid="${user.uuid}"]`);
    if (selectedEl) selectedEl.classList.add('active');

    const headerName = document.getElementById('chat-header-name');
    const headerStatus = document.getElementById('chat-header-status');
    const headerAvatar = document.getElementById('chat-header-avatar');

    if (headerName) headerName.textContent = user.username;
    if (headerStatus) {
        headerStatus.textContent = user.isOnline ? 'В сети' : 'Не в сети';
        headerStatus.style.color = user.isOnline ? '#2ec4b6' : '#888';
    }
    if (headerAvatar) {
        const avatarSrc = user.userImage || DEFAULT_AVATAR;
        headerAvatar.innerHTML = `<img src="${avatarSrc}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onError="this.onerror=null; this.src='${DEFAULT_AVATAR}';" />`;
        headerAvatar.onclick = () => openUserProfile(user.username);
    }

    document.getElementById('message-input').disabled = false;
    document.getElementById('send-btn').disabled = false;

    loadChatHistory(user.uuid);
}

async function loadChatHistory(receiverUuid) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    chatContainer.innerHTML = '';

    try {
        const response = await fetch(`/messages/${currentUserUuid}/${receiverUuid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const messages = await response.json();
            messages.forEach(msg => {
                const formattedMsg = {
                    senderUuid: msg.sender ? msg.sender.uuid : msg.senderUuid,
                    text: msg.text
                };
                appendMessageToChat(formattedMsg);
            });
        }
    } catch (e) {
        console.error('Ошибка загрузки истории сообщений:', e);
    }
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?user_uuid=${currentUserUuid}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("WebSocket подключен");
        loadAllUsers();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'USER_STATUS') {
            updateUserOnlineBadge(data.uuid, data.isOnline);
        } else if (data.type === 'CHAT_MESSAGE') {
            if (activeChatUser && (data.senderUuid === activeChatUser.uuid || data.senderUuid === currentUserUuid)) {
                appendMessageToChat(data);
            }
        }
    };

    ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
    };
}

function updateUserOnlineBadge(uuid, isOnline) {
    const userItem = document.querySelector(`[data-uuid="${uuid}"]`);
    if (userItem) {
        const badge = userItem.querySelector('.status-badge');
        const statusText = userItem.querySelector('.user-item-status');

        if (badge) {
            badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
        }
        if (statusText) {
            statusText.textContent = isOnline ? 'В сети' : 'Не в сети';
            statusText.style.color = isOnline ? '#2ec4b6' : '#888';
        }
    }

    if (activeChatUser && activeChatUser.uuid === uuid) {
        activeChatUser.isOnline = isOnline;
        const headerStatus = document.getElementById('chat-header-status');
        if (headerStatus) {
            headerStatus.textContent = isOnline ? 'В сети' : 'Не в сети';
            headerStatus.style.color = isOnline ? '#2ec4b6' : '#888';
        }
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    if (!input || !activeChatUser) return;

    const text = input.value.trim();
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
        senderUuid: currentUserUuid,
        receiverUuid: activeChatUser.uuid,
        text: text
    };

    ws.send(JSON.stringify(payload));
    input.value = '';
}

function appendMessageToChat(msg) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    const emptyNotice = chatContainer.querySelector('.empty-chat');
    if (emptyNotice) emptyNotice.remove();

    const isMine = msg.senderUuid === currentUserUuid;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message-bubble ${isMine ? 'own' : ''}`;
    msgDiv.textContent = msg.text;

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


async function openMyProfile() {
    try {
        const response = await fetch(`/profile/me`,  {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const user = await response.json();
        const modal = document.getElementById('profile-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('profile-modal-content');

        if (modalTitle) modalTitle.textContent = "Мой профиль";

        const avatarSrc = user.userImage || DEFAULT_AVATAR;

        if (modalContent) {
            modalContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px;">
                    <img id="my-avatar-preview" src="${avatarSrc}" alt="Аватар пользователя" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" onError="this.onerror=null; this.src='${DEFAULT_AVATAR}';" />
                    <div style="margin-top: 8px;">
                        <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display: none;" onchange="uploadMyAvatar(this)">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('avatar-input').click()">Изменить фото</button>
                    </div>
                </div>
                
                <div class="field" style="margin-bottom: 12px;">
                    <label for="edit-username" style="display: block; font-weight: bold; margin-bottom: 4px;">Имя пользователя</label>
                    <input type="text" id="edit-username" name="username" value="${user.username}" style="width: 100%; padding: 8px; box-sizing: border-box;">
                </div>

                <div class="field" style="margin-bottom: 12px;">
                    <label for="edit-email" style="display: block; font-weight: bold; margin-bottom: 4px;">Email (нельзя изменить)</label>
                    <input type="email" id="edit-email" name="email" value="${user.email}" disabled style="width: 100%; padding: 8px; box-sizing: border-box; background: #f0f0f0;">
                </div>

                <div class="field" style="margin-bottom: 12px;">
                    <label for="edit-bio" style="display: block; font-weight: bold; margin-bottom: 4px;">О себе (Bio)</label>
                    <textarea id="edit-bio" name="bio" placeholder="Расскажите о себе..." style="width: 100%; height: 80px; padding: 8px; box-sizing: border-box;">${user.bio || ''}</textarea>
                </div>

                <div id="profile-msg" style="margin-top: 10px; font-size: 14px; min-height: 20px;"></div>

                <div class="actions" style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn-primary" onclick="saveMyProfile()">Сохранить</button>
                    <button type="button" class="btn-secondary" onclick="closeProfileModal()">Отмена</button>
                </div>
            `;
        }

        if (modal) modal.classList.add('open');
    } catch (e) {
        console.error('Ошибка загрузки профиля:', e);
    }
}

async function uploadMyAvatar(input) {
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('file', input.files[0]);

    const msgDiv = document.getElementById('profile-msg');
    msgDiv.style.color = '#1976d2';
    msgDiv.textContent = 'Загрузка фото...';

    try {
        const response = await fetch(`/profile/me/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            msgDiv.style.color = '#2e7d32';
            msgDiv.textContent = 'Фото успешно обновлено!';
            await openMyProfile();
            await loadAllUsers();
        } else {
            throw new Error('Не удалось загрузить фото');
        }
    } catch (e) {
        msgDiv.style.color = '#d32f2f';
        msgDiv.textContent = e.message;
    }
}

async function saveMyProfile() {
    const newUsername = document.getElementById('edit-username').value.trim();
    const newBio = document.getElementById('edit-bio').value.trim();
    const msgDiv = document.getElementById('profile-msg');

    try {
        const response = await fetch(`/profile/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: newUsername,
                bio: newBio
            })
        });

        if (response.ok) {
            localStorage.setItem('username', newUsername);
            currentUsername = newUsername;

            msgDiv.style.color = '#2e7d32';
            msgDiv.textContent = 'Профиль сохранен!';

            setTimeout(() => {
                closeProfileModal();
                loadAllUsers();
            }, 1000);
        } else {
            throw new Error('Ошибка сохранения');
        }
    } catch (e) {
        msgDiv.style.color = '#d32f2f';
        msgDiv.textContent = 'Не удалось сохранить изменения';
    }
}

async function openUserProfile(username) {
    if (username === currentUsername) {
        openMyProfile();
        return;
    }

    try {
        const response = await fetch(`/api/users/${username}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;

        const user = await response.json();
        const modal = document.getElementById('profile-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('profile-modal-content');

        if (modalTitle) modalTitle.textContent = "Профиль";

        const avatarSrc = user.userImage || DEFAULT_AVATAR;

        if (modalContent) {
            modalContent.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <img src="${avatarSrc}" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 10px; object-fit: cover;" onError="this.onerror=null; this.src='${DEFAULT_AVATAR}';" />
                    <h2>${user.username}</h2>
                    <p style="color: #666; margin-top: 4px;">${user.email}</p>
                    <p style="margin-top: 12px;">Статус: <b>${user.isOnline ? '🟢 В сети' : '⚪ Не в сети'}</b></p>
                    <div style="margin-top: 15px; text-align: left; background: #f9f9f9; padding: 12px; border-radius: 8px;">
                        <b>О себе:</b>
                        <p style="margin-top: 4px; color: #444;">${user.bio || 'Пользователь ничего не указал о себе.'}</p>
                    </div>
                    <div class="actions" style="margin-top: 20px;">
                        <button class="btn-secondary" onclick="closeProfileModal()">Закрыть</button>
                    </div>
                </div>
            `;
        }

        if (modal) modal.classList.add('open');
    } catch (e) {
        console.error('Ошибка открытия профиля:', e);
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('open');
}

function handleLogout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

function setupEventListeners() {
    const msgInput = document.getElementById('message-input');
    if (msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loadAllUsers(0, false);
        });
    }

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.onclick = sendMessage;

    const myProfileBtn = document.getElementById('profile-btn');
    if (myProfileBtn) {
        myProfileBtn.onclick = openMyProfile;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => loadAllUsers(0, false);    }

    const userListContainer = document.getElementById('user-list');
    if (userListContainer) {
        userListContainer.addEventListener('scroll', () => {
            const isAtBottom = userListContainer.scrollTop + userListContainer.clientHeight >= userListContainer.scrollHeight - 10;
            if (isAtBottom && (currentPage + 1 < totalPages) && !isLoadingUsers) {
                loadAllUsers(currentPage + 1, true);
            }
        });
    }
}

