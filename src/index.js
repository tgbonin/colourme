var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var PORT = process.env.PORT || process.env.NODE_PORT || 3000;
app.listen(PORT);

var colours = ["red", "blue", "green", "purple", "black", "yellow", "cyan", "brown"];
var players = [];

var serverColourBoxes = new Array(7);
for(var x = 0; x < 7; x++){
    serverColourBoxes[x] = new Array(7);
    for(var y = 0; y < 7; y++){
        serverColourBoxes[x][y] = "white";
    }
}

function handler (req, res) {
	fs.readFile(__dirname + '/../client/index.html', function (err, data){
		if(err) {
			throw err;
		}
		
		res.writeHead(200);
		res.end(data);
	});
}

io.on('connection', function(socket) {
    socket.join('room1');
    
    getPlayerColour(socket);
    
    socket.emit('updateGameBoxes', serverColourBoxes);
    
    socket.on('clientBoxClick', function(data) {
        
        serverColourBoxes[data.x][data.y] = data.colour;
         
        io.sockets.in('room1').emit('networkBoxClicked', {
            colour: data.colour,
                x: data.x,
                y: data.y
            });
	});
	
	socket.on('disconnect', function(data) {
        
         for(var i = 0; i < 8; i++){
             if(players[i] == socket){
                 players[i] = undefined;
             }
         }             
         
         socket.leave('room1');
	});
});

function getPlayerColour(socket){    
    
    for(var i = 0; i < 8; i++){
        if(players[i] == undefined){
            players[i] = socket;
            socket.emit('setColour', colours[i]);
            break;
        }
    }
}

console.log("Server running and listening on port 3000");