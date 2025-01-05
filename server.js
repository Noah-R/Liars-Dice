const game = require("./game.js");
const express = require('express');
const app = express();
const port = 8080;

g1 = new game.Game()

app.use(express.static('dist'));
  
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

const io = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:8080'],
    }
});

io.on('connection', socket => {
    console.log(socket.id);
    g1.addPlayer(socket);
    socket.emit('event', 'you are '+socket.id);

    socket.on('event', (data) => {
        console.log(data);
        socket.emit('event', "received " + data);
    });

});

setTimeout(() => {    
    console.log("Starting the game");
    g1.start();
  }, "5000");

//http://localhost:8080/index.html
//socket.emit to everyone
//socket.broadcast.emit to everyone else
//socket.to(room).emit to room
//socket.join(room) to join room