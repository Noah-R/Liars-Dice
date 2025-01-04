import socket
from game import Game

PORT = 5050
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)
DISCONNECT_MESSAGE = "!DISCONNECT"

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)
        

def start():
    server.listen()
    print(f"[LISTENING] Server is listening on {SERVER}")

    conn, addr = server.accept()
    print(conn, addr)
    
    g1 = Game()
    while len(g1.players) < 2:
        conn, addr = server.accept()
        g1.addPlayer(conn, addr)
    while True:
        g1.round()
    

start()