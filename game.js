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
	constructor(socket) {
		this.socket = socket;
		this.id = socket.id;
		this.diceCount = 5;
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
		this.state = "starting";//starting, readying, round
		//TODO: cleanup players data structures/order
		this.players = [];
		this.ids = {};
		this.playersLeft = 0;
		this.bid = {};
		this.turnPlayer = 0;
	}

	addPlayer(socket) {
		if (this.state == "starting") {
			let player = new Player(socket);
			this.ids[socket.id] = player;
			this.players.push(player);
			shuffle(this.players);
			this.playersLeft++;
		}
	}

	ready(id) {
		this.ids[id].ready = true;
	}

	startIfReady() {
		if(!this.state == "round"){
			return;
		}
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].ready == false) {
				return;
			}
		}
		this.state = "round";
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].rollDice();
			this.players[i].ready = false;
		}
		this.bid = { bidder: -1, amount: 0, pips: 0, challenger: -1 };
		this.sendGameState();
	}

	takeTurn(id, action) {
		//action is "challenge" or [amount, pips], validate and modify bid/turnPlayer for now
		if (id != this.players[this.turnPlayer].id || this.state != "round") {
			return false;
		}
		if (action == "challenge" && this.bid["bidder"] > -1) {
			this.bid["challenger"] = this.turnPlayer;
			this.challenge();
		}
		else if (
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

			this.turnPlayer = (this.turnPlayer + 1) % this.players.length;
			while (this.players[this.turnPlayer].diceCount == 0) {
				this.turnPlayer = (this.turnPlayer + 1) % this.players.length;
			}
		}
		this.sendGameState();
		return true;
	}

	challenge() {
		let total = 0;
		for (let i = 0; i < this.players.length; i++) {
			total += this.players[i].count(this.bid["pips"]);
			this.players[i].ready = false;
		}
		let loser = this.bid["challenger"];
		if (total < this.bid["amount"]) {
			loser = this.bid["bidder"];
		}
		this.players[loser].diceCount -= 1;
		this.turnPlayer = loser;
		while (this.players[this.turnPlayer].diceCount == 0) {
			this.turnPlayer = (this.turnPlayer + 1) % this.players.length;
		}
		this.state = "readying";
	}

	sendGameState(){
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].socket.emit(
				"message",
				this.players[this.turnPlayer].id +"'s turn, Your dice: " + this.players[i].dice + ", player " + this.bid["bidder"] + " bids " + this.bid["amount"] + " " + this.bid["pips"]
			);
		}
	}
}

module.exports = {
	shuffle,
	Game,
	Player,
};
