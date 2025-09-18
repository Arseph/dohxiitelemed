const http = require('http')
const express = require('express')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const httpServer = http.createServer(app)
const io = socketIo(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
})

io.on('connection', (socket) => {
  console.log('Notification client connected:', socket.id)

  socket.on("joinNotificationRoom", (roomId) => {
    socket.join(roomId)
    console.log(`Client ${socket.id} joined room: ${roomId}`)
  })

  socket.on("send-notification", ({ roomId, title, message }) => {
    socket.to(roomId).emit("newNotification", { title, message })
    console.log(`Notification sent to ${roomId}: ${title} - ${message}`)
  })

  socket.on('disconnect', () => {
    console.log('Notification client disconnected:', socket.id)
  })
})

httpServer.listen(3000, () => {
  console.log('Notification Socket.IO server running on port 4000')
})
