const shuffle = function (array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
};

class Player {
	constructor(socket, spectator = false) {
		this.socket = socket;
		this.id = socket.id;
		this.name = "";
		this.diceCount = 5;
		if(spectator){
			this.diceCount = 0;
		}
		this.dice = [];
		this.ready = false;
	}

	count(value) {
		let amount = 0;
		for (let i = 0; i < this.dice.length; i++) {
			if (this.dice[i] == value) {
				amount += 1;
			}
		}
		return amount;
	}

	rollDice() {
		this.dice = [];
		for (let i = 0; i < this.diceCount; i++) {
			this.dice.push(Math.floor(Math.random() * 6) + 1);
		}
	}
}

class Game {
	constructor() {
		this.state = "starting"; //starting, readying, round, over
		this.players = {};
		this.turnOrder = [];
		this.bid = {};
		this.turnPlayer = 0;
	}

	addPlayer(socket) {
		if (this.state == "starting") {
			let player = new Player(socket);
			this.players[socket.id] = player;
			this.turnOrder.push(socket.id);
		}
	}

	ready(id, name) {
		if (!this.state == "round" || this.state == "over") {
			return;
		}
		this.players[id].ready = true;
		this.players[id].name = name.substring(0, 32);
		this.startIfReady();
	}

	startIfReady() {
		for (let i = 0; i < this.turnOrder.length; i++) {
			if (this.players[this.turnOrder[i]].ready == false) {
				return;
			}
		}

		if (this.state == "starting") {
			shuffle(this.turnOrder);
		}

		this.state = "round";
		for (let i = 0; i < this.turnOrder.length; i++) {
			this.players[this.turnOrder[i]].rollDice();
			this.players[this.turnOrder[i]].ready = false;
		}
		this.bid = { bidder: -1, bidderName: "", amount: 0, pips: 0, challenger: -1, challengerName: "" };
		this.sendGameState(true);
	}

	takeTurn(id, action) {
		//action is "challenge" or [amount, pips]
		if (id != this.turnOrder[this.turnPlayer] || this.state != "round") {
			return false;
		}
		if (action == "challenge" && this.bid["bidder"] > -1) {
			this.bid["challenger"] = this.turnPlayer;
			this.bid["challengerName"] = this.players[this.turnOrder[this.turnPlayer]].name;
			this.challenge();
		} else if (
			action[0] < 1 ||
			action[1] < 1 ||
			action[1] > 6 ||
			action[0] < this.bid["amount"] ||
			action[1] < this.bid["pips"] ||
			(action[0] == this.bid["amount"] && action[1] == this.bid["pips"])
		) {
			return false;
		} else {
			this.bid["amount"] = action[0];
			this.bid["pips"] = action[1];
			this.bid["bidder"] = this.turnPlayer;
			this.bid["bidderName"] = this.players[this.turnOrder[this.turnPlayer]].name;
			this.turnPlayer = (this.turnPlayer + 1) % this.turnOrder.length;
		}
		this.sendGameState(this.bid["challenger"] > -1);
		return true;
	}

	challenge() {
		let total = 0;
		for (let i = 0; i < this.turnOrder.length; i++) {
			total += this.players[this.turnOrder[i]].count(this.bid["pips"]);
			this.players[this.turnOrder[i]].ready = false;
		}
		let loser = this.bid["challenger"];
		if (total < this.bid["amount"]) {
			loser = this.bid["bidder"];
		}
		this.players[this.turnOrder[loser]].diceCount -= 1;
		this.turnPlayer = loser;

		if (this.players[this.turnOrder[loser]].diceCount == 0) {
			this.turnOrder.pop(loser);
			this.turnPlayer == this.turnPlayer % this.turnOrder.length;
		}

		this.state = "readying";
		if (this.turnOrder.length == 1) {
			this.state = "over";
		}
	}

	sendGameState(sendPlayers) {
		for (var key of Object.keys(this.players)) {
			let objectToSend = {state: this.state, bid: this.bid};
			
			if (this.state == "round") {
				objectToSend.turnPlayer = this.turnPlayer;
			}

			if (sendPlayers) {
				objectToSend.players = [];
				objectToSend.playerDice = [];
				objectToSend.youAre = -1;
				for (let i = 0; i < this.turnOrder.length; i++) {
					const player =
						this.players[this.turnOrder[i]];
					objectToSend.players.push(player.name);
					if (key == player.id) {
						objectToSend.playerDice.push(player.dice);
						objectToSend.youAre = i;
					}
					else if(this.state != "round"){
						objectToSend.playerDice.push(player.dice);
					}
					else {
						objectToSend.playerDice.push(player.dice.map(number => number * 0));
					}
				}
			}

			if (this.state == "over") {
				objectToSend.winner = this.players[this.turnOrder[0]].name;
			}

			this.players[key].socket.emit("message", objectToSend);
		}
	}
}

module.exports = {
	shuffle,
	Game,
	Player,
};
