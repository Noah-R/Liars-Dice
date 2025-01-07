const shuffle = function (array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

class Player{
	constructor(id) {
		this.id = id;
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

class Game{
	constructor() {
		this.started = false;
		this.players = [];
		this.ids = {}
		this.playersLeft = 0;
		this.bid = {};
		this.turnPlayer = 0;
	}

	addPlayer(id) {
		if(!this.started){
			player = new Player(id);
			this.ids[id] = player;
			this.players.push(player);
			shuffle(this.players);
			this.playersLeft++;
		}
	}

	ready(id){
		this.ids[id].ready = true;
	}

	start(){
		this.started = true
		for (let i = 0; i < this.players.length; i++) {
			this.players[i].rollDice();
			this.players[i].ready = false;
		}
		this.bid = { bidder: -1, amount: 0, pips: 0, challenger: -1 };
	}

	takeTurn(id, action) {//action is "challenge" or [amount, pips], validate and modify bid/turnPlayer for now
		if(id != this.players[turnPlayer].id){
			return false
		}
		if (action == "challenge" && this.bid["bidder"] > -1) {
			this.bid["challenger"] = this.turnPlayer;
			this.challenge()
		}
		if(
			action[0] < 1 ||
			action[1] < 1 ||
			action[1] > 6 ||
			action[0] < this.bid["amount"] ||
			action[1] < this.bid["pips"] ||
			(action[0] == this.bid["amount"] && action[1] == this.bid["pips"])
		) {
			return false
		}
		else{
			this.bid["amount"] = action[0];
			this.bid["pips"] = action[1];
			this.bid["bidder"] = this.game.turnPlayer;

			this.turnPlayer = (this.turnPlayer + 1) % this.players.length;
			while (this.players[this.turnPlayer].diceCount == 0) {
				this.turnPlayer = (this.turnPlayer + 1) % this.players.length;
			}
		}
		//TODO: send each player the game state
		return true;
	}

	challenge(){
		let total = 0;
		for (let i = 0; i < this.players.length; i++) {
			total += this.players[i].count(this.bid["pips"]);
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
	}

	update(){
		for (let i = 0; i < this.players.length; i++) {
			if(this.players[i].ready == false){
				return
			}
		}
		this.start();
		//TODO: send each player the game state
	}
}

module.exports = {
	shuffle, Game, Player
}