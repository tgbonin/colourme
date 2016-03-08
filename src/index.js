var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

var PORT = process.env.PORT || process.env.NODE_PORT || 3000;
app.listen(PORT);

var colours = ["red", "blue", "green", "purple", "black", "yellow", "cyan", "brown"];   //colours available for player use
var players = [];           //array of players in the server

var roundTimeLeft = 30;     //amount of time left in the current round
var numPlayersReady = 0;    //number of players currently ready for the next round
var numPlayers = 0;         //number of players connected
    
var gamePlaying = false;    //bool if the current round is playing

//set up the box colour array
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
    
    //get the new connected player up to date with the current game conditions
    socket.emit('updateGameBoxes', serverColourBoxes);
    socket.emit('setGameState', gamePlaying);
    GetGameLeader();
    
    //update number of players
    io.sockets.in('room1').emit('updateNumPlayers', {
            "serverPlayers": numPlayers,
            "serverPlayersReady": numPlayersReady
    });
    
    //on incoming click from client
    socket.on('clientBoxClick', function(data) {
        //update the colour array
        serverColourBoxes[data.x][data.y] = data.colour;
         
        //update all the players
        io.sockets.in('room1').emit('networkBoxClicked', {
            colour: data.colour,
                x: data.x,
                y: data.y
        });
        
        //check the newest game leader
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










