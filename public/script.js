const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinBtn = document.getElementById('join-btn');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');

let currentRoom = '';
let myName = '';
let secretKey = '';

joinBtn.addEventListener('click', () => {
    myName = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('room').value.trim();
    secretKey = document.getElementById('passkey').value.trim();

    if (!myName || !currentRoom || !secretKey) {
        alert('Saari details bharen!');
        return;
    }

    socket.emit('joinRoom', { username: myName, room: currentRoom, passkey: secretKey });
    
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    document.getElementById('room-title').innerText = `# ${currentRoom}`;
});

sendBtn.addEventListener('click', sendMessage);

function sendMessage() {
    const msgInput = document.getElementById('msg-input');
    const text = msgInput.value.trim();
    if (text) {
        socket.emit('chatMessage', { room: currentRoom, text: text, sender: myName });
        msgInput.value = '';
    }
}

socket.on('message', (data) => {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (data.sender === myName) {
        msgDiv.classList.add('my-msg');
    }
    msgDiv.innerHTML = `<strong>${data.sender}:</strong> ${data.text}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

leaveBtn.addEventListener('click', () => {
    location.reload();
});
