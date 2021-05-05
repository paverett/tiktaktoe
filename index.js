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

/* Generates a random id for the room */
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
    const room = io.of("/").adapter.rooms.get(msg.room);
    if (room && room.size === 1) {
      console.log(`Joining ${msg.room}`)
      socket.join(msg.room);
      socket.broadcast.to(msg.room).emit('player1', msg.name);
      socket.emit('player2', { name: msg.name, room: msg.room })
    } else {
      socket.emit('fullRoom', { message: 'Room is full, unable to connect' });
    }
  });

  /* Passes the game state from player to player */
  socket.on('playedTurn', (msg) => {
    console.log(msg);
    socket.to(msg.room).emit('switchTurns', msg);
  });

  /* Notifies the room of a win */
  socket.on('win', (msg) => {
    socket.to(msg.room).emit('playerWon', msg.player);
  });

  /* Notifies the room of a draw */
  socket.on('draw', (msg) => {
    socket.to(msg).emit('gameDraw');
  })

  /* Disconnects from the room */
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});