const express = require('express')
const app = express()
const port = 8080

app.use(express.static('dist'));
  
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

//

const io = require('socket.io')(3000, {
    cors: {
        origin: ['http://localhost:8080'],
    }
});

io.on('connection', socket => {
    console.log(socket.id);
    socket.on('event', (data) => {
       console.log(data); 
    });
});

//socket.emit to everyone
//socket.broadcast.emit to everyone else
//socket.to(room).emit to room
//socket.join(room) to join room