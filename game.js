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
	constructor(socket, game, spectator = false) {
		this.socket = socket;
		this.game = game;
		this.id = socket.id;
		this.name = "unnamed";
		this.diceCount = 5;
		if (spectator) {
			this.diceCount = 0;
		}
		this.dice = [];
		this.ready = false;
	}

	count(value) {
		let amount = 0;
		for (let i = 0; i < this.dice.length; i++) {
			if (this.dice[i] == value || this.dice[i] == 1) {
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

	sendGameState(sendPlayers) {
		let objectToSend = { state: this.game.state, bid: this.game.bid };

		if (this.game.state == "round") {
			objectToSend.turnPlayer = this.game.turnPlayer;
		}

		if (sendPlayers) {
			objectToSend.players = [];
			objectToSend.playerDice = [];
			objectToSend.youAre = -1;
			for (let i = 0; i < this.game.turnOrder.length; i++) {
				const player = this.game.players[this.game.turnOrder[i]];
				objectToSend.players.push(player.name);
				if (this.id == player.id) {
					objectToSend.playerDice.push(player.dice);
					objectToSend.youAre = i;
				} else if (this.game.state != "round") {
					objectToSend.playerDice.push(player.dice);
				} else {
					objectToSend.playerDice.push(
						player.dice.map((number) => number * 0)
					);
				}
			}
		}

		if (this.game.state == "over") {
			objectToSend.winner =
				this.game.players[
					this.game.turnOrder[(this.game.turnPlayer + 1) % 2]
				].name;
		}

		this.socket.emit("message", objectToSend);
	}
}

class Game {
	constructor() {
		this.state = "starting"; //starting, readying, round, over
		this.players = {};
		this.turnOrder = [];
		this.spectators = [];
		this.bid = {};
		this.turnPlayer = 0;
	}

	restart() {
		this.state = "starting";
		this.turnOrder = this.turnOrder.concat(this.spectators);
		this.spectators = [];
		this.bid = {};
		this.turnPlayer = 0;

		for (let i = 0; i < this.turnOrder.length; i++) {
			this.players[this.turnOrder[i]].diceCount = 5;
			this.players[this.turnOrder[i]].ready = false;
		}
		this.sendGameState(true);
	}

	addPlayer(socket) {
		if (this.state == "starting") {
			this.players[socket.id] = new Player(socket, this);
			this.turnOrder.push(socket.id);
		} else {
			this.players[socket.id] = new Player(socket, this, spectator = true);
			this.spectators.push(socket.id);
		}
		this.sendGameState(true);
	}

	removePlayer(socket) {
		delete this.players[socket.id];

		let loc = this.turnOrder.indexOf(socket.id);
		if (loc > -1) {
			this.turnOrder.splice(loc, 1);
		}

		loc = this.spectators.indexOf(socket.id);
		if (loc > -1) {
			this.spectators.splice(loc, 1);
		}

		if (this.state == "readying" || this.state == "round") {//if someone leaves mid-game, scrap the game
			this.restart();
		} else {
			this.startIfReady();
		}
	}

	ready(id, name) {
		if (!this.state == "round") {
			return;
		}
		this.players[id].ready = true;
		this.players[id].name = name;
		this.startIfReady();
	}

	startIfReady() {
		for (let i = 0; i < this.turnOrder.length; i++) {
			if (this.players[this.turnOrder[i]].ready == false) {
				this.sendGameState(true);
				return false;
			}
		}

		if (this.state == "starting") {
			if(this.turnOrder.length < 2){
				this.sendGameState(true);
				return false;
			}
			shuffle(this.turnOrder);
		} else if (this.state == "over") {
			this.restart();
			return true;
		} else {
			if (this.players[this.turnOrder[this.turnPlayer]].diceCount == 0) {//eliminated players get removed here
				this.spectators.push(
					this.turnOrder.splice(this.turnPlayer, 1)[0]
				);
				this.turnPlayer == this.turnPlayer % this.turnOrder.length;
			}
		}

		this.state = "round";
		for (let i = 0; i < this.turnOrder.length; i++) {
			this.players[this.turnOrder[i]].rollDice();
			this.players[this.turnOrder[i]].ready = false;
		}
		this.bid = {
			bidder: -1,
			bidderName: "",
			amount: 0,
			pips: 0,
			challenger: -1,
			challengerName: "",
		};
		this.sendGameState(true);
		return true;
	}

	takeTurn(id, action) {
		//action is "challenge" or [amount, pips]
		if (id != this.turnOrder[this.turnPlayer] || this.state != "round") {
			return false;
		}
		if (action == "challenge" && this.bid["bidder"] > -1) {
			this.bid["challenger"] = this.turnPlayer;
			this.bid["challengerName"] =
				this.players[this.turnOrder[this.turnPlayer]].name;
			this.challenge();
		} else if (
			action == "challenge" ||
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
			this.bid["bidderName"] =
				this.players[this.turnOrder[this.turnPlayer]].name;
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
		if (total < this.bid["amount"]) {
			this.turnPlayer = this.bid["bidder"];
		}
		this.players[this.turnOrder[this.turnPlayer]].diceCount -= 1;
		//if on 0, player will be removed from turn order on next successful call of startIfReady()

		this.state = "readying";
		if (
			this.turnOrder.length == 2 &&
			this.players[this.turnOrder[this.turnPlayer]].diceCount == 0
		) {
			this.state = "over";
		}
	}

	sendGameState(sendPlayers) {
		for (var key of Object.keys(this.players)) {
			this.players[key].sendGameState(sendPlayers);
		}
	}
}

module.exports = {
	shuffle,
	Game,
	Player,
};
