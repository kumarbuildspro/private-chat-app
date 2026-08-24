const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Rooms ki passkey store karne ke liye
const roomPasskeys = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room, passkey }) => {
        // Agar room naya hai toh passkey set karo, warna check karo
        if (!roomPasskeys[room]) {
            roomPasskeys[room] = passkey;
        } else if (roomPasskeys[room] !== passkey) {
            socket.emit('errorMsg', 'Incorrect Secret Passkey!');
            return;
        }

        socket.join(room);
        socket.currentRoom = room;
        socket.username = username;

        // Success event
        socket.emit('joinSuccess', { room });
        
        // System message
        io.to(room).emit('message', {
            sender: 'System',
            text: `${username} ne room join kiya.`
        });
    });

    socket.on('chatMessage', ({ room, text, sender }) => {
        io.to(room).emit('message', { sender, text });
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom && socket.username) {
            io.to(socket.currentRoom).emit('message', {
                sender: 'System',
                text: `${socket.username} room chhod kar chala gaya.`
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
