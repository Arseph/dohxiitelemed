const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: "https://telemed-dev.dohsox.com", // your frontend domain
    // origin: "*", // allow all for local testing
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  let currentRoom = null; // ✅ track room per socket

  socket.on("join", (roomId) => {
    // socket.join(roomId) // ❌ didn't save roomId for disconnect
    currentRoom = roomId; // ✅ save it
    socket.join(roomId)
    console.log(`${socket.id} joined room: ${roomId}`);
  });

  socket.on('offer', ({roomId, offer}) => {
    socket.to(roomId).emit('offer', offer)
  })

  socket.on('answer', ({roomId, answer}) => {
    socket.to(roomId).emit('answer', answer)
  })

  socket.on('ice-candidate', ({roomId,candidate}) => {
    socket.to(roomId).emit('ice-candidate', candidate)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // socket.to(roomId).emit("user-disconnected", socket.id) // ❌ roomId not in scope here
    if (currentRoom) {
      socket.to(currentRoom).emit("user-disconnected", socket.id) // ✅ now in scope
    }
  })
})

// Start HTTPS server
// httpServer.listen(3000, '0.0.0.0', () => { // local testing
//   console.log('Socket.IO server running on port 3000')
// })
httpServer.listen(3000, '192.168.1.75', () => { // production
  console.log('Socket.IO server running on port 3000')
})
