let shuffle = function(array){//untested
    for (let i = array.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1));
                      
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}

class Player{
    constructor(game){
        this.game = game;
        this.diceCount = 5;
        this.dice = [];
    }
    
    count(value){
        let amount = 0
        for(let i = 0; i < this.dice.length; i++){
            if(this.dice[i] == value){
                amount += 1;
            }
        }
        return amount
    }

    rollDice(){
        this.dice = [];
        for(let i = 0; i < this.diceCount; i++){
            this.dice.push(Math.floor(Math.random*6) + 1);
        }
        //send them their dice
    }
    
    takeTurn(bid, turnPlayer){
        let challenge = false;
        if(bid["bidder"] > -1){
            //ask to challenge
        }
        amount = 0;
        pips = 0;

        if(challenge == "Y"){
            bid["challenger"] = turnPlayer;
        }
        else{
            while(
            amount < 1 ||
            pips < 1 ||
            pips > 6 ||
            amount < bid["amount"] ||
            pips < bid["pips"] ||
            (amount == bid["amount"] && pips == bid["pips"])
            ){
                //ask amount
                amount = 1;
                //ask pips
                pips = 1;
            }
            bid["amount"] = amount;
            bid["pips"] = pips;
            bid["bidder"] = turnPlayer;
        }
        return bid;
    }
}

class Game{
    constructor(){
        this.players = [];
        this.bid = {};
        this.turnPlayer = 0;
    }

    addPlayer(){//player needs connection link
        this.players.push(new Player(this));
        shuffle(this.players);
    }
    
    round(){
        for(let i = 0; i < this.players.length; i++){
            this.players[i].rollDice();
        }
        this.bid = {bidder: -1, amount: 0, pips: 0, challenger: -1};
        while(this.bid["challenger"] == -1){
            this.bid = this.players[this.turnPlayer].takeTurn(this.bid, this.turnPlayer);
            this.turnPlayer = (this.turnPlayer + 1) % (this.players.length);
            while(this.players[this.turnPlayer].diceCount == 0){
                this.turnPlayer = (this.turnPlayer + 1) % (this.players.length);
            }
        }
        let total = 0;
        for(let i = 0; i < this.players.length; i++){
            total += this.players[i].count(this.bid["pips"]);
        }
        let loser = this.bid["challenger"];
        if(total < this.bid["amount"]){
            loser = this.bid["bidder"];
        }
        this.players[loser].diceCount -= 1;
        this.turnPlayer = loser;
        while(this.players[this.turnPlayer].diceCount == 0){
            this.turnPlayer = (this.turnPlayer + 1) % (this.players.length);
        }
    }
}