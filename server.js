const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Active rooms database in-memory
const activeRooms = {};

io.on('connection', (socket) => {

  // Handle Joining Room securely
  socket.on('join-room', ({ roomName, username, roomKey }, callback) => {
    if (!roomName || !username || !roomKey) {
      return callback({ success: false, message: 'Sabhi fields required hain!' });
    }

    const formattedRoom = roomName.trim().toLowerCase();

    // Verification check for private room key
    if (activeRooms[formattedRoom]) {
      if (activeRooms[formattedRoom].key !== roomKey) {
        return callback({ success: false, message: 'Galat Room Secret Key!' });
      }
    } else {
      // Room create karo
      activeRooms[formattedRoom] = {
        key: roomKey,
        users: []
      };
    }

    // Join Socket Room
    socket.join(formattedRoom);
    socket.roomName = formattedRoom;
    socket.username = username;

    activeRooms[formattedRoom].users.push(socket.id);

    callback({ success: true });

    // Notify room members
    socket.to(formattedRoom).emit('system-message', {
      text: `${username} ne private chat room join kar liya hai.`
    });
  });

  // Handle Realtime Messages
  socket.on('send-message', (data) => {
    const room = socket.roomName;
    if (!room || !activeRooms[room]) return;

    const payload = {
      sender: socket.username,
      message: data.message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Only send to authenticated socket members inside this room
    io.to(room).emit('receive-message', payload);
  });

  // Disconnect lifecycle
  socket.on('disconnect', () => {
    const room = socket.roomName;
    if (room && activeRooms[room]) {
      activeRooms[room].users = activeRooms[room].users.filter(id => id !== socket.id);
      
      socket.to(room).emit('system-message', {
        text: `${socket.username} ne room chhod diya hai.`
      });

      if (activeRooms[room].users.length === 0) {
        delete activeRooms[room];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
