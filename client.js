import { createRoot } from "react-dom/client";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
const diceFaces = ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function Player(props) {
	let dice = "";
	for (let i = 0; i < props.dice.length; i++) {
		dice += diceFaces[props.dice[i]];
	}
	return (
		<div class="player horizontal">
			<p class="center">{dice}</p>
			<h3 class="center">
				{props.name}
				{props.isTurnPlayer && " to play"}
			</h3>
		</div>
	);
}

function Selector(props) {
	return (
		<div class="horizontal">
			<button onClick={props.up}>🔼</button>
			{props.value < props.display.length && (
				<p>{props.display[props.value]}</p>
			)}
			{props.value >= props.display.length && <p>{props.value}</p>}
			<button onClick={props.down}>🔽</button>
		</div>
	);
}

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	let [gameState, setGameState] = useState("starting");
	let [bid, setBid] = useState([]);
	let [amount, setAmount] = useState(0);
	let [pips, setPips] = useState(0);
	let [turnPlayer, setTurnPlayer] = useState(0);
	let [players, setPlayers] = useState([]);
	let [playerDice, setPlayerDice] = useState([]);
	let [youAre, setYouAre] = useState(0);
	let [winner, setWinner] = useState("");
	let [name, setName] = useState("");

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
				if (data.bid.bidder > -1) {
					let b =
						data.bid.bidderName +
						" bids " +
						data.bid.amount +
						" " +
						diceFaces[data.bid.pips];
					if (data.bid.challenger > -1) {
						b += ", " + data.bid.challengerName + " challenges";
					}
					setBid(b);
					setAmount(data.bid.amount);
					setPips(data.bid.pips);
				} else {
					setBid("No bid yet");
					setAmount(1);
					setPips(1);
				}
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
		socket.emit("move", [amount, pips]);
	};

	let challenge = () => {
		socket.emit("move", "challenge");
	};

	let ready = () => {
		socket.emit("ready", name);
	};

	const handleNameChange = (event) => {
		setName(event.target.value);
	};

	let opponentOutput = [];
	for (let i = 0; i < players.length; i++) {
		opponentOutput.push(
			<Player
				dice={playerDice[i]}
				name={players[i]}
				isTurnPlayer={i == turnPlayer}
			/>
		);
	}
	if(youAre > -1){
		opponentOutput = opponentOutput.slice(youAre + 1).concat(opponentOutput.slice(0, youAre));
	}

	let selfAndBid = [
		<div class="center">
			{youAre > -1 && (
				<Player
					dice={playerDice[youAre]}
					name={players[youAre]}
					isTurnPlayer={youAre == turnPlayer}
				/>
			)}
			{youAre == -1 && <p>You are spectating</p>}
		</div>,
		<div class="center">{bid}</div>,
	];

	let startingScreen = [
		<div class="middle">
			<input
				value={name}
				onChange={handleNameChange}
				placeholder="Enter Name"
			></input>
			<button onClick={ready}>Ready</button>
		</div>,
	];

	let roundScreen = [
		<div class="center">{opponentOutput}</div>,
		<div class="inputBar center">
			{selfAndBid}
			<Selector
				up={() => {
					setAmount(Math.min(amount + 1, 256));
				}}
				down={() => {
					setAmount(Math.max(amount - 1, 1));
				}}
				value={amount}
				display={[]}
			/>
			<Selector
				up={() => {
					setPips(Math.min(pips + 1, 6));
				}}
				down={() => {
					setPips(Math.max(pips - 1, 1));
				}}
				value={pips}
				display={diceFaces}
			/>
			<div class="horizontal">
				<button onClick={move}>Bid</button>
				<button onClick={challenge}>Challenge</button>
			</div>
		</div>,
	];

	let readyingScreen = [
		<div class="center">{opponentOutput}</div>,
		<button
			class="middle"
			onClick={ready}
		>
			Ready
		</button>,
		<div class="inputBar center">{selfAndBid}</div>,
	];

	let overScreen = [
		<div class="center">{opponentOutput}</div>,
		<div class="middle">		
			<h1>{winner} wins!</h1>
			<br></br>
			<button onClick={ready}>Ready</button>
		</div>,
		<div class="inputBar center">{selfAndBid}</div>,
	];

	return (
		<div>
			{gameState == "round" && <div>{roundScreen}</div>}
			{gameState == "starting" && <div>{startingScreen}</div>}
			{gameState == "readying" && <div>{readyingScreen}</div>}
			{gameState == "over" && <div>{overScreen}</div>}
		</div>
	);
}

const domNode = document.getElementById("root");
const root = createRoot(domNode);
root.render(<App />);
