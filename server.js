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

let games = {}//game name: game object
let players = {}//#socket.id: game name

io.on("connection", (socket) => {
	console.log(socket.id + " connected");
	socket.emit("message", {message: "you are " + socket.id, state: "lobby"});
	players[socket.id] = "";

	socket.on("message", (data) => {
		console.log(data);
		socket.emit("message", {message: "received " + data});
	});

	socket.on("join", (data) => {
		let gameName = "#"+data.substring(0, 32)
		if(!(gameName in games)){
			games[gameName] = new game.Game();
		}
		games[gameName].addPlayer(socket, "");
		players[socket.id] = gameName;
	});

	socket.on("ready", (data) => {
		if(games[players[socket.id]]){
			games[players[socket.id]].makePlayer(socket.id);
			games[players[socket.id]].setName(socket.id, data.substring(0, 32));
			games[players[socket.id]].ready(socket.id);
		}
	});

	socket.on("spectate", (data) => {
		if(games[players[socket.id]]){
			games[players[socket.id]].setName(socket.id, data.substring(0, 32));
			games[players[socket.id]].makeSpectator(socket.id);
		}
	});

	socket.on("move", (data) => {
		if(games[players[socket.id]]){
			games[players[socket.id]].takeTurn(socket.id, data);
		}
	});

	let nixPlayer = () => {
		if(games[players[socket.id]]){
			games[players[socket.id]].removePlayer(socket.id);
			if(games[players[socket.id]].players.length == 0){		
				delete games[players[socket.id]];
			}
		}
		players[socket.id] = "";
	}

	socket.on("leave", (data) => {
		nixPlayer();
	});

	socket.on("disconnect", (reason) => {
		nixPlayer();
	});
});

httpServer.listen(3000);