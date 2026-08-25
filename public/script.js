const socket = io();

const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const chatForm = document.getElementById('chat-form');
const errorMsg = document.getElementById('error-msg');
const messagesContainer = document.getElementById('messages-container');
const currentRoomTitle = document.getElementById('current-room-title');
const leaveBtn = document.getElementById('leave-btn');
const activeUsersList = document.getElementById('active-users-list');

let currentUser = "";

// Authentication & Join Room
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const roomName = document.getElementById('room-name').value.trim();
    const roomKey = document.getElementById('room-key').value.trim();

    currentUser = username;

    socket.emit('join-room', { roomName, username, roomKey }, (response) => {
        if (response.success) {
            authScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            currentRoomTitle.innerText = `# ${roomName}`;
            errorMsg.innerText = "";
        } else {
            errorMsg.innerText = response.message;
        }
    });
});

// Send Message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (message) {
        socket.emit('send-message', { message });
        input.value = '';
    }
});

// Receive Message
socket.on('receive-message', (data) => {
    const isSelf = data.sender === currentUser;
    
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isSelf ? 'self' : 'other');
    msgDiv.setAttribute('id', `msg-${data.id}`);

    const deleteOption = isSelf ? `<button class="delete-btn" onclick="deleteMessage('${data.id}')">Delete</button>` : '';

    msgDiv.innerHTML = `
        <strong>${isSelf ? 'Aap' : escapeHtml(data.sender)}</strong><br>
        <span class="msg-text">${escapeHtml(data.message)}</span>
        <div class="message-meta">
            <span>${data.time}</span>
            ${deleteOption}
        </div>
    `;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Delete Message Trigger
function deleteMessage(messageId) {
    socket.emit('delete-message', { messageId });
}

// Handle Message Deleted event from server
socket.on('message-deleted', (data) => {
    const targetMsg = document.getElementById(`msg-${data.messageId}`);
    if (targetMsg) {
        targetMsg.remove();
    }
});

// Update Room Members List
socket.on('update-users', (users) => {
    activeUsersList.innerText = `Online (${users.length}): ${users.join(', ')}`;
});

// System Notifications
socket.on('system-message', (data) => {
    const sysDiv = document.createElement('div');
    sysDiv.classList.add('system-msg');
    sysDiv.innerText = data.text;
    messagesContainer.appendChild(sysDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Leave Chat
leaveBtn.addEventListener('click', () => {
    window.location.reload();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
