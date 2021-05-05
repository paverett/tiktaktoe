const socket = io.connect('http://localhost:3000');

function newGame() {
  var creator = document.getElementById("creator").value;
  if (!creator) {
    alert('Please enter a name');
  } else {
    socket.emit('createNew', creator);
  }
}

socket.on('newGame', (msg) => {
  const message =
    `Hello, ${msg.name}. Please other player to enter game id: 
    ${msg.room}. Waiting for other player...`;

  alert(message);
});

function joinGame() {
  const joinee = document.getElementById("joinee").value;
  const roomNumber = document.getElementById("roomNumber").value;
  if (!joinee || !roomNumber) {
    alert('Please enter a name and a gameId');
  } else {
    socket.emit('joinGame', { name: joinee, room: roomNumber});
  }
}