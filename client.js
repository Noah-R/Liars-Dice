import { createRoot } from "react-dom/client";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io();
const diceFaces = ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function Player(props) {
	let dice = [];
	for (let i = 0; i < props.dice.length; i++) {
		dice.push(
			<span
				class={
					(props.highlight &&
						(props.highlight == props.dice[i] ||
							props.dice[i] == 1) &&
						props.highlightColor) +
					" " +
					(props.dice[i] > 0 && "big")
				}
			>
				{diceFaces[props.dice[i]]}
			</span>
		);
	}
	return (
		<div class="player horizontal">
			<p class="center slim">{dice}</p>
			<h3 class="center">
				{props.name}
				{props.isTurnPlayer && <i> to play</i>}
			</h3>
		</div>
	);
}

function Selector(props) {
	return (
		<div class="horizontal">
			<button
				class={"selectorButton " + (!props.isTurnPlayer && "grayedOut")}
				onClick={props.isTurnPlayer && props.up}
			>
				🔼
			</button>
			{props.value < props.display.length && (
				<p class="selectorLabel">{props.display[props.value]}</p>
			)}
			{props.value >= props.display.length && (
				<p class="selectorLabel">{props.value}</p>
			)}
			<button
				class={"selectorButton " + (!props.isTurnPlayer && "grayedOut")}
				onClick={props.isTurnPlayer && props.down}
			>
				🔽
			</button>
		</div>
	);
}

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	let [room, setRoom] = useState("");
	let [gameState, setGameState] = useState("lobby");
	let [bid, setBid] = useState("");
	let [bidValues, setBidValues] = useState([]);
	let [amount, setAmount] = useState(0);
	let [pips, setPips] = useState(0);
	let [turnPlayer, setTurnPlayer] = useState(0);
	let [players, setPlayers] = useState([]);
	let [playerDice, setPlayerDice] = useState([]);
	let [totalDice, setTotalDice] = useState([]);
	let [youAre, setYouAre] = useState(0);
	let [winner, setWinner] = useState("");
	let [name, setName] = useState("");
	let [canReady, setCanReady] = useState(false);
	let [spectators, setSpectators] = useState([]);
	let [gameLog, setGameLog] = useState([]);
	let [reverseTurnOrder, setReverseTurnOrder] = useState(false);
	let [highlightColor, setHighlightColor] = useState("blue");

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
						b +=
							", " +
							data.bid.challengerName +
							" challenges, " +
							(data.bid.successful
								? data.bid.challengerName
								: data.bid.bidderName) +
							" loses a die";						
						setHighlightColor(data.bid.successful ? "green" : "red");//delete to make highlight always blue
					} else {
						setGameLog((current) => [...current, b]);
					}
					setBid(b);
					setAmount(data.bid.amount);
					setPips(data.bid.pips);
					setBidValues([data.bid.amount, data.bid.pips]);
				} else {
					setBid("No bid yet");
					setGameLog([]);
					setAmount(1);
					setPips(1);
					setBidValues([0, 0]);
					setCanReady(true);
				}
			}
			if ("playerDice" in data) {
				setPlayerDice(data.playerDice);
				let count = 0;
				for (let i = 0; i < data.playerDice.length; i++) {
					count += data.playerDice[i].length;
				}
				setTotalDice(count);
			}
			if ("youAre" in data) {
				setYouAre(data.youAre);
			}
			if ("winner" in data) {
				setWinner(data.winner);
			}
			if ("spectators" in data) {
				setSpectators(data.spectators);
			}
			if ("reverseTurnOrder" in data) {
				setReverseTurnOrder(data.reverseTurnOrder);
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

	let join = () => {
		socket.emit("join", room);
	};

	let leave = () => {
		socket.emit("leave", "");
		setGameState("lobby");
	};

	let spectate = () => {
		socket.emit("spectate", name);
	};

	let ready = () => {
		socket.emit("ready", name);
		setCanReady(false);
	};

	const handleRoomChange = (event) => {
		setRoom(event.target.value);
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
				highlight={
					(gameState == "readying" || gameState == "over") &&
					bidValues[1]
				}
				highlightColor={highlightColor}
			/>
		);
	}
	if (youAre > -1) {
		opponentOutput = opponentOutput
			.slice(youAre + 1)
			.concat(opponentOutput.slice(0, youAre));
	}

	let selfAndBid = [
		<div>
			{youAre > -1 && (
				<Player
					dice={playerDice[youAre]}
					name={players[youAre]}
					isTurnPlayer={youAre == turnPlayer}
					highlight={
						(gameState == "readying" || gameState == "over") &&
						bidValues[1]
					}
					highlightColor={highlightColor}
				/>
			)}
			{youAre == -1 && <p>You are spectating</p>}
			<div class="center big">{bid}</div>
		</div>,
	];

	let logList = [
		<div class="bottomleft">
			<h3>Round Log:</h3>
			<ul>
				{gameLog.map((name) => (
					<li>{name}</li>
				))}
			</ul>
		</div>,
	];

	let spectatorList = [
		<div class="bottomright">
			<h3>{spectators.length > 0 && "Spectators:"}</h3>
			<ul>
				{spectators.map((name) => (
					<li>{name}</li>
				))}
			</ul>
		</div>,
	];

	let lobbyScreen = [
		<h1 class="big">Liar's Dice</h1>,
		<div class="middle">
			<input
				autofocus="autofocus"
				value={room}
				onChange={handleRoomChange}
				placeholder="Enter Room Code"
				maxlength="32"
			></input>
			<button onClick={join}>Join</button>
		</div>,
	];

	let startingScreen = [
		<h1 class="big">Liar's Dice</h1>,
		<div class="middle">
			<input
				value={name}
				onChange={handleNameChange}
				placeholder="Enter Your Name"
				maxlength="32"
			></input>
			<button
				onClick={ready}
				disabled={name == ""}
			>
				Ready
			</button>
			<button
				onClick={spectate}
				disabled={name == ""}
			>
				Spectate
			</button>
			<button onClick={leave}>Leave</button>
			<ul>
				Players:{" "}
				{players.map((player) => (
					<li>{player}</li>
				))}
			</ul>
		</div>,
		spectatorList,
	];

	let roundScreen = [
		<div class="center">{opponentOutput}</div>,
		<div class="middle">
			<h1 class="inMiddle big centerText">
				{youAre == turnPlayer && "Your turn!"}
				{reverseTurnOrder ? "🔄" : "🔁"}
			</h1>
		</div>,
		<div class="inputBar center">
			{selfAndBid}
			<div>
				<Selector
					up={() => {
						setAmount(Math.min(amount + 1, totalDice));
					}}
					down={() => {
						setAmount(
							Math.max(amount - 1, Math.max(bidValues[0], 1))
						);
					}}
					value={amount}
					display={[]}
					isTurnPlayer={youAre == turnPlayer}
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
					isTurnPlayer={youAre == turnPlayer}
				/>
				<div class="horizontal">
					<button
						class="selectorLabel"
						onClick={move}
						disabled={
							youAre != turnPlayer ||
							amount < bidValues[0] ||
							(amount == bidValues[0] && pips <= bidValues[1])
						}
					>
						Bid
					</button>
					<p class="selectorLabel">‎</p>
					<button
						class={
							"selectorLabel " +
							(youAre == turnPlayer &&
								bid != "No bid yet" &&
								"redButton")
						}
						onClick={challenge}
						disabled={youAre != turnPlayer || bid == "No bid yet"}
					>
						Challenge
					</button>
				</div>
			</div>
		</div>,
		logList,
		spectatorList,
	];

	let readyingScreen = [
		<div class="center">{opponentOutput}</div>,
		<div>
			{youAre > -1 && (
				<div class="middle">
					<br />
					<button
						class="inMiddle"
						onClick={ready}
						disabled={!canReady}
					>
						{canReady && "Ready!"}
						{!canReady && "Waiting..."}
					</button>
				</div>
			)}
		</div>,
		<div class="inputBar center">{selfAndBid}</div>,
		logList,
		spectatorList,
	];

	let overScreen = [
		<div class="center">{opponentOutput}</div>,
		<div>
			{
				<div class="middle">
					<br />
					<button
						class="inMiddle"
						onClick={ready}
						disabled={!canReady || youAre == -1}
					>
						{winner} wins!
					</button>
				</div>
			}
		</div>,
		<div class="inputBar center">{selfAndBid}</div>,
		logList,
		spectatorList,
	];

	return (
		<div>
			<a
				class="topright"
				href="rules.html"
				target="_blank"
			>
				Rules
			</a>
			{gameState == "lobby" && <div>{lobbyScreen}</div>}
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
