from player import Player
from random import shuffle

class Game:
    def __init__(self):
        self.players = []
        self.bid = {}
        self.turnPlayer = 0
    
    def addPlayer(self, conn, addr):
        self.players.append(Player(self, conn, addr))
        shuffle(self.players)
    
    def round(self):
        for player in self.players:
            player.rollDice()
        self.bid = {"bidder": -1, "amount": 0, "pips": 0, "challenger": -1}
        while(self.bid["challenger"] == -1):
            self.bid = self.players[self.turnPlayer].takeTurn(self.bid, self.turnPlayer)
            self.turnPlayer = (self.turnPlayer + 1) % len(self.players)
            while(self.players[self.turnPlayer].diceCount == 0):
                self.turnPlayer = (self.turnPlayer + 1) % len(self.players)
        
        total = 0
        for player in self.players:
            total += player.count(self.bid["pips"])
        loser = self.bid["challenger"]
        if(total < self.bid["amount"]):
            loser = self.bid["bidder"]
        self.players[loser].diceCount -= 1
        self.turnPlayer = loser
        while(self.players[self.turnPlayer].diceCount == 0):
            self.turnPlayer = (self.turnPlayer + 1) % len(self.players)