const socket = io.connect('http://localhost:3000');

/* Player holds player related info */

class Player {
  constructor() {
    this.name = '';
    this.letter = '';
    this.currentTurn;
  }

  setName(name) {
    this.name = name;
  }

  setLetter(letter) {
    this.letter = letter;
  }

  setCurrentTurn(turn) {
    this.currentTurn = turn;
    const message = turn ? 'Your turn' : 'Waiting for Opponent';
    setTurnMessage(message);
  }

  getName() {
    return this.name;
  }

  getLetter() {
    return this.letter;
  }

  getCurrentTurn() {
    return this.currentTurn;
  }
}
/* ------------------------------------------- */

/* GameBoard holds game related info */

class GameBoard {
  constructor() {
    this.room = '';
    this.board = [0,0,0,0,0,0,0,0,0];
    this.map = new Map();
    this.lastLetter = 'O';
    this.lastPosition = '';
    this.moveCount = 0;
  }

  updateGameBoard(board) {
    this.board = board.board;
    this.lastPosition = board.lastPosition;
    this.lastLetter = board.lastLetter;
    this.moveCount = board.moveCount;
  }

  setBoard(board) {
    this.board = board;
  }

  setLastLetter(letter) {
    this.lastLetter = letter;
  }

  setLastPosition(pos) {
    this.lastPosition = pos;
  }

  addMoveCount() {
    this.moveCount++;
  }

  getRoom() {
    return this.room;
  }

  getMap() {
    return this.map;
  }

  getBoard() {
    return this.board;
  }

  getLastLetter() {
    return this.lastLetter;
  }

  getLastPosition() {
    return this.lastPosition;
  }

  getMoveCount() {
    return this.moveCount;
  }
}
/* ------------------------------------------- */

let player = new Player();
let gameBoard = new GameBoard();

/* Utility functions */
function setTurnMessage(message) {
  document.getElementById('turnMessage').innerText=message;
}

function setUserMessage(message) {
  document.getElementById('userMessage').innerText=message;
}

function updateSquare(position, letter) {
  let square = document.getElementById(`square-${position}`);
  square.disabled = true;
  square.innerText = letter;
}

function displayBoard(message) {
  document.getElementById('registration').style.display='none';
  document.getElementById('tikTakBoard').style.display='flex';
  setUserMessage(message);
}

function undisplayBoard(message) {
  document.getElementById('tikTakBoard').style.display='none';
  setUserMessage(message);
}

function disableSquares() {
  for (i = 0; i < 9; i++) {
    document.getElementById(`square-${i}`).disabled = true;
  }
}
/* ------------------------------------------- */

/* Game Related Functions */

function newGame() {
  var creator = document.getElementById("creator").value;
  if (!creator) {
    alert('Please enter a name');
  } else {
    socket.emit('createNew', creator);
    player.setLetter('X');
    player.setName(creator);
  }
}

socket.on('newGame', (msg) => {
  const message =
    `Hello, ${msg.name}. Please ask other player to enter game id: 
    ${msg.room}. Waiting for other player...`;
  displayBoard(message);
  gameBoard.room = msg.room;
});

function joinGame() {
  const joinee = document.getElementById("joinee").value;
  const roomNumber = document.getElementById("roomNumber").value;
  gameBoard.room = roomNumber;
  if (!joinee || !roomNumber) {
    alert('Please enter a name and a gameId');
  } else {
    socket.emit('joinGame', { name: joinee, room: roomNumber });
    const message = `Hello, ${joinee}. Connecting now...`;
    displayBoard(message);
  }
}

socket.on('player1', (msg) => {
  const message = `Hello, ${player.getName()}`;
  setUserMessage(message);
  player.setCurrentTurn(true);
});

socket.on('player2', (msg) => {
  const message = `Hello, ${msg.name}`;
  displayBoard(message);
  player.setName(msg.name);
  player.setLetter('O');
  player.setCurrentTurn(false);
});

function updateBoard(clickEvent, position) {
  if(!player.getCurrentTurn()) {
    alert("Not your turn");
    return;
  }
  if (gameBoard.lastLetter == player.getLetter()) {
    alert("Cant play two moves in one turn");
    return;
  }
  let number = parseInt(clickEvent.value, 10);
  updateSquare(position, player.getLetter());
  gameBoard.board[position] = number;
  gameBoard.lastLetter = player.getLetter();
  gameBoard.lastPosition = position;
  gameBoard.addMoveCount();
  gameBoard.map[number] = player.getLetter();
  player.setCurrentTurn(!player.getCurrentTurn());
  let gameWon = playerWon(gameBoard.getBoard(), gameBoard.getMap());
  console.log(gameWon);
  if (gameWon === true) {
    socket.emit('win', { player: player.getName(), room: gameBoard.getRoom() });
    setUserMessage(`${player.getName()} wins!`);
    document.getElementById("turnMessage").innerText = '';
    disableSquares();
    return;
  }
  if (gameBoard.getMoveCount() == 9) {
    socket.emit('draw', gameBoard.getRoom());
  }
  socket.emit('playedTurn', gameBoard);
}

/* Syncs the gameboard and updates the board for the player */
socket.on('switchTurns', (msg) => {
  player.setCurrentTurn(!player.getCurrentTurn());
  updateSquare(msg.lastPosition, msg.lastLetter);
  gameBoard.updateGameBoard(msg);
});

/* 

Each square is assigned a number. 
Based on who chose the square and the sum of the row/column/diagonal a winner can be determined.

*/
function playerWon(board, gameMap) {
  let wins = [168, 14, 112, 896, 546, 146,	292,	584]
  for (i=0; i<board.length; i+=3) {
    let num1 = board[i]
    let num2 = board[i+1]
    let num3 = board[i+2]
    if (checkNums(num1, num2, num3, gameMap)) {
      return true;
    }; 
  }
  for (i=0; i<3; i++) {
    let num1 = board[i]
    let num2 = board[i+3]
    let num3 = board[i+6]
    if (checkNums(num1, num2, num3, gameMap)) {
      return true;
    }; 
  }
  let rDiagonal1 = board[0];
  let rDiagonal2 = board[4];
  let rDiagonal3 = board[8];
  if (checkNums(rDiagonal1, rDiagonal2, rDiagonal3, gameMap)) {
    return true;
  }; 

  let lDiagonal1 = board[2];
  let lDiagonal2 = board[4];
  let lDiagonal3 = board[6];
  if (checkNums(lDiagonal1, lDiagonal2, lDiagonal3, gameMap)) {
    return true;
  }; 
  return false;
}

function checkNums(num1, num2, num3, gameMap) {
  let wins = [168, 14, 112, 896, 546, 146,	292,	584]
  if (gameMap[num1] == gameMap[num2] 
    && gameMap[num1] == gameMap[num3]
    && gameMap[num2] == gameMap[num3]) {
    let winSum = num1 + num2 + num3
    if (wins.includes(winSum)) {
      return true;
    }
  }   
}

socket.on('playerWon', (msg) => {
  const message = `${msg} won!`;
  setUserMessage(message);
  document.getElementById("turnMessage").innerText = '';
  disableSquares();
});

socket.on('gameDraw', () => {
  const message = 'Draw!';
  setUserMessage(message);
  document.getElementById("turnMessage").innerText = '';
  disableSquares();
});

/* ------------------------------------------- */
