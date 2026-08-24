const socket = io();

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinBtn = document.getElementById('join-btn');
const sendBtn = document.getElementById('send-btn');
const leaveBtn = document.getElementById('leave-btn');
const msgInput = document.getElementById('msg-input');

let currentRoom = '';
let myName = '';

joinBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Page refresh hone se rokne ke liye
    
    myName = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('room').value.trim();
    const passkey = document.getElementById('passkey').value.trim();

    if (!myName || !currentRoom || !passkey) {
        alert('Saari details sahi se bharen!');
        return;
    }

    socket.emit('joinRoom', { username: myName, room: currentRoom, passkey: passkey });
});

socket.on('joinSuccess', (data) => {
    joinScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    document.getElementById('room-title').innerText = `# ${data.room}`;
});

socket.on('errorMsg', (msg) => {
    alert(msg);
});

sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
});

msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
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
    } else if (data.sender === 'System') {
        msgDiv.classList.add('sys-msg');
    }
    
    msgDiv.innerHTML = `<strong>${data.sender}:</strong> ${data.text}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

leaveBtn.addEventListener('click', () => {
    location.reload();
});
