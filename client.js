import { createRoot } from "react-dom/client";
import React, {useState, useEffect} from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	let [gameState, setGameState] = useState("starting");
	let [log, setLog] = useState("");
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
			if (data.state) {
				setGameState(data.state);
			}
			setLog((log += data.message + "\n"));
			console.log(data.message); //delete
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

	let bid = () => {
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

	return (
		<div>
			<div id="output">{log}</div>
			{gameState == "round" && (
				<div>
					<input id="input" value={inputValue} onChange={handleInputChange} ></input>{" "}
					<button
						id="bid"
						onClick={bid}
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
