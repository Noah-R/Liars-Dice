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

let games = {}//room name: game object
let players = {}//#socket.id: room name

io.on("connection", (socket) => {
	console.log(socket.id + " connected");
	socket.emit("message", {message: "you are " + socket.id});
	players[socket.id] = "";

	socket.on("message", (data) => {
		console.log(data);
		socket.emit("message", {message: "received " + data});
	});

	socket.on("join", (data) => {
		room = data.substring(0, 32)
		if(!(room in games)){
			games[room] = new game.Game();
		}
		games[room].addPlayer(socket);
		games[room].players[socket.id].sendGameState(true);
		players[socket.id] = room;
	});

	socket.on("leave", (data) => {
		games[players[socket.id]].removePlayer(socket);
		if(games[players[socket.id]].players.length == 0){		
			delete games[players[socket.id]];
		}
		players[socket.id] = "";
	});

	socket.on("ready", (data) => {
		games[players[socket.id]].ready(socket.id, data.substring(0, 32));
	});

	socket.on("move", (data) => {
		games[players[socket.id]].takeTurn(socket.id, data);
	});
});

httpServer.listen(3000);