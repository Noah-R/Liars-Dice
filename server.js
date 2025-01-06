const game = require("./game.js");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static('dist'));
const httpServer = createServer(app);

const io = new Server(httpServer, {
	//options go here
});

g1 = new game.Game()

io.on("connection", (socket) => {
    console.log(socket.id + " connected");
    g1.addPlayer(socket);
    socket.emit('event', 'you are '+socket.id);

    socket.on('event', (data) => {
        console.log(data);
        socket.emit('event', "received " + data);

        if(data == "start"){
            g1.start();
        }
    });
});

httpServer.listen(3000);