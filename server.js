const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  },
  maxHttpBufferSize: 1e7 // Allow file transfers up to 10MB
});

app.use(express.static(path.join(__dirname, 'public')));

// Active rooms database in-memory: { roomName: { key: string, users: [{ id, username }] } }
const activeRooms = {};

io.on('connection', (socket) => {

  // Handle Joining Room securely
  socket.on('join-room', ({ roomName, username, roomKey }, callback) => {
    if (!roomName || !username || !roomKey) {
      return callback({ 
        success: false, 
        message: 'Kripya Room Code, Username aur Secret Passkey sabhi bharein!' 
      });
    }

    const formattedRoom = roomName.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Check Key & Name Verification
    if (activeRooms[formattedRoom]) {
      if (activeRooms[formattedRoom].key !== roomKey) {
        return callback({ 
          success: false, 
          message: '⚠️ Warning: Aapka Room Code ya Secret Passkey galat hai! Kripya sahi Secret Passkey enter karein tabhi access milega.' 
        });
      }
    } else {
      // Room Initialization
      activeRooms[formattedRoom] = {
        key: roomKey,
        users: []
      };
    }

    // Join Socket Room
    socket.join(formattedRoom);
    socket.roomName = formattedRoom;
    socket.username = cleanUsername;

    // Track User Object
    activeRooms[formattedRoom].users.push({ id: socket.id, username: cleanUsername });

    callback({ success: true });

    // Send updated user list to everyone in room
    const userList = activeRooms[formattedRoom].users.map(u => u.username);
    io.to(formattedRoom).emit('update-users', userList);

    // Notify room members
    socket.to(formattedRoom).emit('system-message', {
      text: `${cleanUsername} ne private chat room join kar liya hai.`
    });
  });

  // Handle Realtime Messages & Media
  socket.on('send-message', (data) => {
    const room = socket.roomName;
    if (!room || !activeRooms[room]) return;

    if (!data.message && !data.image) return;

    const payload = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      sender: socket.username,
      message: data.message || '',
      image: data.image || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    io.to(room).emit('receive-message', payload);
  });

  // Handle Typing Events
  socket.on('typing', (isTyping) => {
    const room = socket.roomName;
    if (room) {
      socket.to(room).emit('display-typing', {
        username: socket.username,
        isTyping: isTyping
      });
    }
  });

  // Handle Delete Message
  socket.on('delete-message', ({ messageId }) => {
    const room = socket.roomName;
    if (room && messageId) {
      io.to(room).emit('message-deleted', { messageId });
    }
  });

  // Disconnect lifecycle
  socket.on('disconnect', () => {
    const room = socket.roomName;
    if (room && activeRooms[room]) {
      activeRooms[room].users = activeRooms[room].users.filter(u => u.id !== socket.id);
      
      const remainingUsers = activeRooms[room].users.map(u => u.username);
      io.to(room).emit('update-users', remainingUsers);

      socket.to(room).emit('system-message', {
        text: `${socket.username || 'Ek member'} ne room chhod diya hai.`
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
