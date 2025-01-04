import { io } from "socket.io-client"

const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log(`Connected with id: ${socket.id}`);
    socket.emit('event', 'data');
});
