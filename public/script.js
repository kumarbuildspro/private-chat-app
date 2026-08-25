const socket = io();

const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const chatForm = document.getElementById('chat-form');
const errorMsg = document.getElementById('error-msg');
const messagesContainer = document.getElementById('messages-container');
const currentRoomTitle = document.getElementById('current-room-title');
const leaveBtn = document.getElementById('leave-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const activeUsersList = document.getElementById('active-users-list');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const typingIndicator = document.getElementById('typing-indicator');

const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const themeToggleLogin = document.getElementById('theme-toggle-login');
const themeToggleChat = document.getElementById('theme-toggle-chat');

let currentUser = "";
let typingTimeout = null;

// Audio Notification System (Web Audio API Synthesizer)
function playMessageSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        console.log("Audio playback not allowed without interaction yet.");
    }
}

// Dark / Light Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    const icon = newTheme === 'light' ? '☀️' : '🌙';
    themeToggleLogin.innerText = icon;
    themeToggleChat.innerText = icon;
}
themeToggleLogin.addEventListener('click', toggleTheme);
themeToggleChat.addEventListener('click', toggleTheme);

// Emoji Picker Controls
emojiBtn.addEventListener('click', () => emojiPicker.classList.toggle('hidden'));
emojiPicker.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        messageInput.value += e.target.innerText;
        emojiPicker.classList.add('hidden');
        messageInput.focus();
    }
});

// Authentication & Join Room Validation
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
            // Displays warning code and secret key validation alerts
            errorMsg.innerText = response.message;
        }
    });
});

// Typing Event Listeners
messageInput.addEventListener('input', () => {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', false);
    }, 2000);
});

socket.on('display-typing', (data) => {
    if (data.isTyping) {
        typingIndicator.innerText = `${data.username} type kar rahe hain...`;
        typingIndicator.classList.remove('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
});

// Image Upload Handler
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            socket.emit('send-message', { image: evt.target.result });
        };
        reader.readAsDataURL(file);
        imageInput.value = "";
    }
});

// Send Message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();

    if (message) {
        socket.emit('send-message', { message });
        messageInput.value = '';
        socket.emit('typing', false);
    }
});

// Receive Message
socket.on('receive-message', (data) => {
    const isSelf = data.sender === currentUser;
    
    if (!isSelf) {
        playMessageSound();
    }

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isSelf ? 'self' : 'other');
    msgDiv.setAttribute('id', `msg-${data.id}`);

    const deleteOption = isSelf ? `<button class="delete-btn" onclick="deleteMessage('${data.id}')">Delete</button>` : '';

    let contentHtml = `<strong>${isSelf ? 'Aap' : escapeHtml(data.sender)}</strong><br>`;
    if (data.message) {
        contentHtml += `<span class="msg-text">${escapeHtml(data.message)}</span>`;
    }
    if (data.image) {
        contentHtml += `<br><img src="${data.image}" class="chat-image" alt="Shared image" />`;
    }
    contentHtml += `
        <div class="message-meta">
            <span>${data.time}</span>
            ${deleteOption}
        </div>
    `;

    msgDiv.innerHTML = contentHtml;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Delete Message Trigger
function deleteMessage(messageId) {
    socket.emit('delete-message', { messageId });
}

socket.on('message-deleted', (data) => {
    const targetMsg = document.getElementById(`msg-${data.messageId}`);
    if (targetMsg) targetMsg.remove();
});

// Update Room Members
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

// Clear Local Screen Messages
clearChatBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
});

// Leave Room
leaveBtn.addEventListener('click', () => {
    window.location.reload();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
