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
	constructor(socket, game, name, spectator = false) {
		this.socket = socket;
		this.game = game;
		this.id = socket.id;
		this.name = name;
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

	sendSpectators() {
		this.socket.emit("message", {
			spectators: this.game.spectators.map(
				(id) => this.game.players[id].name
			),
		});
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
		this.reverseTurnOrder = false;
	}

	restart() {
		this.state = "starting";
		this.turnOrder = this.turnOrder.concat(this.spectators);
		this.spectators = [];
		this.bid = {};
		this.turnPlayer = 0;
		this.reverseTurnOrder = false;

		for (let i = 0; i < this.turnOrder.length; i++) {
			this.players[this.turnOrder[i]].diceCount = 5;
			this.players[this.turnOrder[i]].ready = false;
		}
		this.sendGameState(true);
		this.sendSpectators();
	}

	addPlayer(socket, spectator = false, name = "") {
		if (this.state == "starting" && !spectator) {
			this.players[socket.id] = new Player(socket, this, name);
			this.turnOrder.push(socket.id);
		} else {
			this.players[socket.id] = new Player(socket, this, name, true);
			this.spectators.push(socket.id);
		}
		this.sendGameState(true);
		this.sendSpectators();
	}

	removePlayer(id) {
		delete this.players[id];

		let loc = this.turnOrder.indexOf(id);
		if (loc > -1) {
			this.turnOrder.splice(loc, 1);
			
			if (this.state == "readying" || this.state == "round") {
				//if someone leaves mid-game, scrap the game
				this.restart();
			} else {
				this.startIfReady();
			}
		}

		loc = this.spectators.indexOf(id);
		if (loc > -1) {
			this.spectators.splice(loc, 1);
			this.sendSpectators();
		}
	}

	makePlayer(id){
		if(this.state != "starting" || this.players[id].diceCount > 0){
			return false;
		}
		this.players[id].diceCount = 5;
		
		let loc = this.spectators.indexOf(id);
		if (loc > -1) {
			this.spectators.splice(loc, 1);
		}
		this.turnOrder.push(id)

		this.sendSpectators();
	}

	makeSpectator(id){
		if(this.state != "starting" || this.players[id].diceCount == 0){
			return false;
		}
		this.players[id].diceCount = 0;
		
		let loc = this.turnOrder.indexOf(id);
		if (loc > -1) {
			this.turnOrder.splice(loc, 1);
		}
		this.spectators.push(id)

		this.sendSpectators();
		this.startIfReady();
		
	}

	setName(id, name){
		this.players[id].name = name;
	}

	ready(id) {
		if (!this.state == "round" || this.players[id].name == "") {
			return;
		}
		this.players[id].ready = true;
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
			if (this.turnOrder.length < 2) {
				this.sendGameState(true);
				return false;
			}
			shuffle(this.turnOrder);
		} else if (this.state == "over") {
			this.restart();
			return true;
		} else {
			this.reverseTurnOrder = !this.reverseTurnOrder;

			if (this.players[this.turnOrder[this.turnPlayer]].diceCount == 0) {
				//eliminated players get removed here
				this.spectators.push(
					this.turnOrder.splice(this.turnPlayer, 1)[0]
				);
				if(this.reverseTurnOrder){
					this.turnPlayer = (this.turnPlayer + this.turnOrder.length - 1) % this.turnOrder.length;
				}
				else{
					this.turnPlayer = this.turnPlayer % this.turnOrder.length;
				}
				this.sendSpectators();
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
			successful: true
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
			typeof action != "object" ||
			action.length != 2 ||
			typeof action[0] != "number" ||
			typeof action[1] != "number" ||
			action[0] < 1 ||
			action[1] < 1 ||
			action[1] > 6 ||
			action[0] < this.bid["amount"] ||
			(action[0] == this.bid["amount"] && action[1] <= this.bid["pips"])
		) {
			return false;
		} else {
			this.bid["amount"] = action[0];
			this.bid["pips"] = action[1];
			this.bid["bidder"] = this.turnPlayer;
			this.bid["bidderName"] =
				this.players[this.turnOrder[this.turnPlayer]].name;
			if(this.reverseTurnOrder){
				this.turnPlayer = (this.turnPlayer + this.turnOrder.length - 1) % this.turnOrder.length;
			}
			else{
				this.turnPlayer = (this.turnPlayer + 1) % this.turnOrder.length;
			}
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
			this.bid["successful"] = false;
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

	sendSpectators() {
		for (var key of Object.keys(this.players)) {
			this.players[key].sendSpectators();
		}
	}
}

module.exports = {
	shuffle,
	Game,
	Player,
};
