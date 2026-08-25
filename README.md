# private-chat-app
# 🔒 End-to-End Private Realtime Chat Application

A lightweight, secure, and feature-rich realtime private chat application built with **Node.js, Express, Socket.io, and Vanilla Web Technologies**. 

This application allows users to create or join private, password-protected chat rooms with end-to-end access validation, media sharing, and instant user interaction feedback.

---

## ✨ Features

- **🔐 Room Authentication & Security**: Secret room passkey validation. Access is strictly denied if the wrong Room Code or Passkey is entered.
- **💬 Realtime Messaging**: Instant bidirectional text communication powered by Socket.io.
- **⌨️ Realtime Typing Indicator**: Displays live "User is typing..." feedback.
- **📷 Image Sharing**: Send images directly within the chat interface using Base64 data streaming.
- **🔔 Audio Notifications**: Subtle audio chime for incoming messages built with Web Audio API (no external sound files required).
- **😊 Custom Emoji Picker**: Built-in inline emoji picker for quick expressive messaging.
- **🌙 Dark / Light Mode**: Dynamic theme switcher with persistent session UI layout.
- **🗑️ Message Management**:
  - **Delete Message**: Delete your own messages in realtime across all room participants.
  - **Clear Screen**: Local chat window reset option to clean your view.
- **👥 Active Room Presence**: Realtime online user counter and member list.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Realtime Engine**: Socket.io
- **Frontend**: HTML5, CSS3 (CSS Variables + Glassmorphism UI), Modern JavaScript (ES6+)
- **Audio Synthesizer**: Native Web Audio API

---

## 📁 Project Structure

```text
private-chat-app/
├── package.json
├── server.js
└── public/
    ├── index.html
    ├── style.css
    └── script.js
    
