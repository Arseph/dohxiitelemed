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
    methods: ["GET", "POST"]
  }
});
io.on('connection', (socket) => {
  socket.on("join", (roomId) => {
    socket.join(roomId)
  });
  console.log('Client connected:', socket.id)

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
  })
})
// Start HTTPS server
httpServer.listen(3000, '192.168.1.75', () => {
  console.log('Secure Socket.IO server running on port 3000')
})
