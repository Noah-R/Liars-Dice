import { createRoot } from "react-dom/client";
import React from "react";

function NavigationBar() {
	// TODO: Actually implement a navigation bar
	return <h1>Hello from React!</h1>;
}

const domNode = document.getElementById("output");
const root = createRoot(domNode);
root.render(<NavigationBar />);

/*
import { io } from "socket.io-client"

const socket = io('http://localhost:3000');
socket.on('connect', () => {
    console.log(`Connected with id: ${socket.id}`);
    
    document.getElementById("button").onclick = () => {
        socket.emit(document.getElementById("eventType").value, document.getElementById("input").value);
    }
    
    socket.on('message', (data) => {
        document.getElementById("output").innerHTML += data + "<br>";
     });
});*/
