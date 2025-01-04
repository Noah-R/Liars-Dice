from random import randint


HEADER = 16
FORMAT = 'utf-8'

def receive(conn):
    msg_length = conn.recv(HEADER).decode(FORMAT)
    if msg_length:
        msg_length = int(msg_length)
        msg = conn.recv(msg_length).decode(FORMAT)
        return msg

def send(conn, msg):
    message = msg.encode(FORMAT)
    msg_length = len(message)
    send_length = str(msg_length).encode(FORMAT)
    send_length += b' ' * (HEADER - len(send_length))
    conn.send(send_length)
    conn.send(message)

class Player():
    def __init__(self, game, conn, addr, dice = 5):
        self.game = game
        self.conn = conn
        self.addr = addr
        self.diceCount = dice
        self.dice = []
    
    def count(self, value):
        amount = 0
        for num in self.dice:
            if(num == value):
                amount += 1
        return amount

    def rollDice(self):
        self.dice = []
        for _ in range(self.diceCount):
            self.dice.append(randint(1, 6))
        send(self.conn, str(self.dice))
    
    def takeTurn(self, bid, turnPlayer):
        challenge = False
        if(bid["bidder"] > -1):
            send(self.conn, str(bid["amount"]) + " " + str(bid["pips"]) + ", challenge? Y/anything else")
            challenge = str(receive(self.conn))
        amount = 0
        pips = 0

        if(challenge == "Y"):
            bid["challenger"] = turnPlayer
        else:
            while(amount < 1 or pips < 1 or pips > 6 or amount < bid["amount"] or pips < bid["pips"] or (amount == bid["amount"] and pips == bid["pips"])):
                send(self.conn, "amount?")
                amount = int(receive(self.conn))
                send(self.conn, "pips?")
                pips = int(receive(self.conn))
            bid["amount"] = amount
            bid["pips"] = pips
            bid["bidder"] = turnPlayer
        return bid