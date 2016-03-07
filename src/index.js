var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var PORT = process.env.PORT || process.env.NODE_PORT || 3000;
app.listen(PORT);

var colours = ["red", "blue", "green", "purple", "black", "yellow", "cyan", "brown"];
var players = [];

var roundTimeLeft = 30;
var numPlayersReady = 0;
var numPlayers = 0;

var gamePlaying = false;

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
    
    numPlayers++;
    
    getPlayerColour(socket);
    
    socket.emit('updateGameBoxes', serverColourBoxes);
    io.sockets.in('room1').emit('setGameState', gamePlaying);
    
    io.sockets.in('room1').emit('updateNumPlayers', {
            "serverPlayers": numPlayers,
            "serverPlayersReady": numPlayersReady
    });
    
    socket.on('clientBoxClick', function(data) {
        
        serverColourBoxes[data.x][data.y] = data.colour;
         
        io.sockets.in('room1').emit('networkBoxClicked', {
            colour: data.colour,
                x: data.x,
                y: data.y
        });
        
        GetGameLeader();
        
	});
	
	socket.on('disconnect', function(data) {
        
         for(var i = 0; i < 8; i++){
             if(players[i] == socket){
                 players[i] = undefined;
             }
         }          
         
         numPlayers--;
         
         io.sockets.in('room1').emit('updateNumPlayers', {
            "serverPlayers": numPlayers,
            "serverPlayersReady": numPlayersReady
         });
         
         socket.leave('room1');
	});
    
    
    socket.on('readyUp', function(){
        numPlayersReady++;
        io.sockets.in('room1').emit('updateNumPlayers', {
            "serverPlayers": numPlayers,
            "serverPlayersReady": numPlayersReady
        });
    });
    
});

function getPlayerColour(socket){    
    
    for(var i = 0; i < 8; i++){
        if(players[i] === undefined){
            players[i] = socket;
            socket.emit('setColour', colours[i]);
            break;
        }
    }    
}

setInterval(TimeUpdate, 1000);

function TimeUpdate(){
    if(gamePlaying){
        roundTimeLeft--;
        
        io.sockets.in('room1').emit('updateTime', roundTimeLeft);
        
        if(roundTimeLeft === 0){
            io.sockets.in('room1').emit('setGameState', false);
            gamePlaying = false;
        }
    }
    else{
        if((numPlayersReady/numPlayers) > 0.5 && numPlayers > 1){
            numPlayersReady = 0;
            roundTimeLeft = 30;
            gamePlaying = true;
            
            ResetGameBoxes();
            
            io.sockets.in('room1').emit('setGameState', true);
            
            io.sockets.in('room1').emit('updateNumPlayers', {
                "serverPlayers": numPlayers,
                "serverPlayersReady": numPlayersReady
            });
        }
    }
}

function ResetGameBoxes(){
    for(var x = 0; x < 7; x++){
        for(var y = 0; y < 7; y++){
            serverColourBoxes[x][y] = "white";
        }
    }
    GetGameLeader();
    io.sockets.in('room1').emit('updateGameBoxes', serverColourBoxes);
}

function GetGameLeader(){
    
    var numEachColour = new Array(8);
    for(var n = 0; n < 8; n++) numEachColour[n] = 0;
    
    for(var x = 0; x < 7; x++){
        for(var y = 0; y < 7; y++){
            var boxColour = serverColourBoxes[x][y];
            
            for(var c = 0; c < 8; c++){
                if(boxColour == colours[c]){
                    numEachColour[c]++;
                }
            }
            
        }
    }
    
    var leader = "None";
    var leaderNum = 0;
    
    for(var m = 0; m < 8; m++){
        if(numEachColour[m] > leaderNum){
            leader = colours[m];
            leaderNum = numEachColour[m];
        }
    }
    
    io.sockets.in('room1').emit('updateLeader', leader);
}

console.log("Server running and listening on port 3000");










