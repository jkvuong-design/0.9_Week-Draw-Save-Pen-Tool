const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static frontend files (index.html, style.css, app.js) from the 'public' directory
app.use(express.static('public'));

// Manage socket connection lifecycle
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Broadcast drawing and stamp actions to all other connected clients
  socket.on('draw_stamp', (data) => {
    socket.broadcast.emit('draw_stamp', data);
  });

  // Relay canvas clear command to every client
  socket.on('clear_canvas', () => {
    io.emit('clear_canvas');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start listening on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});