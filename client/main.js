"use strict";

var socket;
var timeLeft; 
var userName;
var userColour;

var canvas;
var ctx;

var colourBoxArray;
    
function init() {
    
    userColour = "#0f0";
    
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    
    //set up the box array so that all boxes are white
    colourBoxArray = new Array(7);
    for(var x = 0; x < 7; x++){
        colourBoxArray[x] = new Array(7);
        for(var y = 0; y < 7; y++){
            colourBoxArray[x][y] = "#fff";
        }
    }
    
    canvas.onclick = HandleBoxClick;
    
    setInterval(Update, 17);
    
    socket = io.connect();
    
    socket.on('connect', function() {
     
    });
    
    //socket.on('networkBoxClicked', networkUpdate);
    
    socket.on('updateGameBoxes'), function(data){
        console.log("test");
        colourBoxArray = data;
    }
    
}

function Update(){
    DrawBoxes();
}

function networkUpdate(data){
    colourBoxArray[data.x][data.y] = data.colour;
}

function DrawBoxes(){
    
    for(var x = 0; x < 7; x++){
        for(var y = 0; y < 7; y++){
            
            var boxColour = colourBoxArray[x][y];
            ctx.fillStyle = boxColour;
            ctx.strokeStyle = "#aaa";
            ctx.lineWidth = 5;
            
            ctx.fillRect((100*x), (100*y), 100, 100);
            ctx.strokeRect((100*x), (100*y), 100, 100);
            
        }
    }
    
}

function HandleBoxClick(e){
    
    var mousePos = GetMousePos(e);
    
    var xPos = Math.floor(mousePos.x/100);
    var yPos = Math.floor(mousePos.y/100);
    
    colourBoxArray[xPos][yPos] = userColour;
    
    socket.emit("clientBoxClick", {
        colour: userColour,
        x: xPos,
        y: yPos
    });
}

function GetMousePos(e){
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}


window.onload = init;