import { createRoot } from "react-dom/client";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function Player(props) {
	let dice = "";
	for (let i = 0; i < props.dice.length; i++) {
		dice += "[" + props.dice[i] + "]";
	}
	return (
		<div class="player">
			<p>{dice}</p>
			<h3>
				{props.id}
				{props.isTurnPlayer && " to play"}
			</h3>
		</div>
	);
}

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	let [gameState, setGameState] = useState("starting");
	let [bid, setBid] = useState([]);
	let [turnPlayer, setTurnPlayer] = useState(0);
	let [players, setPlayers] = useState([]);
	let [playerDice, setPlayerDice] = useState([]);
	let [youAre, setYouAre] = useState(0);
	let [winner, setWinner] = useState("");
	const [inputValue, setInputValue] = useState("");

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
			console.log(`Connected with id: ${socket.id}`);
		}

		function onDisconnect() {
			setIsConnected(false);
			console.log(`Disconnected`);
		}

		function onMessage(data) {
			if ("message" in data) {
				console.log(data.message);
			}
			if ("state" in data) {
				setGameState(data.state);
			}
			if ("turnPlayer" in data) {
				setTurnPlayer(data.turnPlayer);
			}
			if ("players" in data) {
				setPlayers(data.players);
			}
			if ("bid" in data) {
				setBid(data.bid);
			}
			if ("playerDice" in data) {
				setPlayerDice(data.playerDice);
			}
			if ("youAre" in data) {
				setYouAre(data.youAre);
			}
			if ("winner" in data) {
				setWinner(data.winner);
			}
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("message", onMessage);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("message", onMessage);
		};
	}, []);

	let move = () => {
		socket.emit("move", inputValue);
	};

	let challenge = () => {
		socket.emit("move", "challenge");
	};

	let ready = () => {
		socket.emit("ready", "");
	};

	const handleInputChange = (event) => {
		setInputValue(event.target.value);
	};

	let playerOutput = [];
	for (let i = youAre; i < players.length + youAre; i++) {
		let j = i % players.length;
		playerOutput.push(
			<Player
				dice={playerDice[j]}
				id={players[j]}
				isTurnPlayer={j == turnPlayer}
			/>
		);
	}
	return (
		//todo: build frontend from paper designs, state variables, give stuff id's and classes and use css to move it around
		<div>
			<div id="players">{playerOutput}</div>
			<div id="output">{bid}</div>
			{gameState == "round" && (
				<div>
					<input
						id="input"
						value={inputValue}
						onChange={handleInputChange}
					></input>{" "}
					<button
						id="bid"
						onClick={move}
					>
						Bid
					</button>
					<button
						id="challenge"
						onClick={challenge}
					>
						Challenge
					</button>
				</div>
			)}
			{gameState != "round" && (
				<button
					id="ready"
					onClick={ready}
				>
					Ready
				</button>
			)}
		</div>
	);
}

const domNode = document.getElementById("root");
const root = createRoot(domNode);
root.render(<App />);
