const express = require('express');
const app = express();
const http = require('http');
const path = require('path')
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var ID = function () {
  return '_' + Math.random().toString(36).substr(2, 9);
};

io.on('connection', (socket) => {

  /* Allows a player to create a new game */
  socket.on('createNew', (msg) => {
    let newId = ID();
    console.log(`Created ${newId}`)
    socket.join(newId);
    socket.emit('newGame', { name: msg, room: newId });
  });

  /* Allows a second player to join the room */
  socket.on('joinGame', (msg) => {
    console.log(`Joining ${msg.room}`)
    const room = io.sockets.adapter.rooms.get('Room Name');
    if (room && room.length === 1) {
        socket.join(msg.room);
        socket.broadcast.to(msg.room).emit('player1', {});
        socket.emit('player2', { name: msg.name, room: msg.room })
    } else {
        socket.emit('fullRoom', { message: 'Room is full, unable to connect' });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});