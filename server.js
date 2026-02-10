const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Serve files from the 'public' folder
app.use(express.static(__dirname + '/public'));

let players = {};

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    // Create a new player object
    players[socket.id] = {
        x: 100,
        y: 450,
        playerId: socket.id,
        color: Object.keys(players).length === 0 ? '0xff0000' : '0x0000ff' // P1 Red, P2 Blue
    };

    // Send the players object to the new player
    socket.emit('currentPlayers', players);

    // Update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle Disconnect
    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    // Handle Player Movement
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        // Tell everyone else this player moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    // Handle Interaction (Button Press)
    socket.on('buttonPressed', function () {
        io.emit('openDoor'); // Tell everyone to open the door
    });
});

server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
});
