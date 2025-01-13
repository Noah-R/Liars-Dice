import { createRoot } from "react-dom/client";
import React, {useState, useEffect} from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	let [gameState, setGameState] = useState("starting");
	let [bid, setBid] = useState("");
	let [turn, setTurn] = useState(0);
	let [players, setPlayers] = useState([]);
	let [youAre, setYouAre] = useState(0);
	let [winner, setWinner] = useState("");
	const [inputValue, setInputValue] = useState('');

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
			if('message' in data){
				console.log(data.message);
			}
			if ('state' in data) {
				setGameState(data.state);
			}
			if ('bid' in data) {
				setBid(data.bid.bidder + " bids " + data.bid.amount + " " + data.bid.pips);
			}
			if ('turn' in data) {
				setTurn(data.turn);
			}
			if ('players' in data) {//todo: turn this temp unpacking code into matching data structures on the server
				let players = []
				for(let i = 0; i < data.players.length; i++){
					players.push(data.players[i].name + " has " + data.players[i].dice);
				}
				setPlayers(players);
			}
			if ('youAre' in data) {
				setYouAre(data.youAre);
			}
			if ('winner' in data) {
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

	return (//todo: build frontend from paper designs, state variables
		<div>
			<div id="output">{"turn: " + turn + ", bid: " + bid + ", players: " + players + ", you are " + youAre + ", winner: " + winner}</div>
			{gameState == "round" && (
				<div>
					<input id="input" value={inputValue} onChange={handleInputChange} ></input>{" "}
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
