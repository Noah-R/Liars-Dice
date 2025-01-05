import { io } from "socket.io-client"

const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log(`Connected with id: ${socket.id}`);
    
    document.getElementById("button").onclick = () => {
        socket.emit('event', document.getElementById("input").value);
    }
    
    socket.on('event', (data) => {
        document.getElementById("output").innerHTML += data + "<br>";
     });
});