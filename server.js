const game = require("./game.js");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static("dist"));
const httpServer = createServer(app);

const io = new Server(httpServer, {
	//options go here
});

g1 = new game.Game();

io.on("connection", (socket) => {
	console.log(socket.id + " connected");
	g1.addPlayer(socket);
	socket.emit("message", "you are " + socket.id);

	socket.on("message", (data) => {
		console.log(data);
		socket.emit("message", "received " + data);
	});

	socket.on("ready", (data) => {
		g1.ready(socket.id);
	});

	socket.on("move", (data) => {
		g1.takeTurn(socket.id, data);
	});
});

httpServer.listen(3000);