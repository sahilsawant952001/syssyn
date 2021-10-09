const express = require("express");
const socketClient = require("socket.io-client");
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const Emitter = require('events');
const eventEmitter = new Emitter();
 
const totalServers = 5;
const selfServerId = 4;

var insideCriticalSection = 0;
var wantToEnterCriticalSection = 0;
var myTimeStamp = 0;

var queue = [];

const app = express();
app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.set('eventEmitter',eventEmitter);

var replyCount = 0;

const http = require('http').createServer(app)
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
})

const server1 = socketClient("http://localhost:3000");
server1.emit("join",selfServerId);
const server2 = socketClient("http://localhost:4000");
server2.emit("join",selfServerId);
const server3 = socketClient("http://localhost:5000");
server3.emit("join",selfServerId);
const server5 = socketClient("http://localhost:7000");
server5.emit("join",selfServerId);


eventEmitter.on("acquire critical section",() => {
  wantToEnterCriticalSection = 0;
  insideCriticalSection = 1;
  var choice = 0;
  console.log("Server ",selfServerId," Inside Of Critical Section!")
  setTimeout(() => {
    console.log("Server ",selfServerId," Outside Of Critical Section!")
    insideCriticalSection = 0;
    replyCount = 0;
    for(var i=0;i<queue.length;i++)
    {
      io.to(queue[i]).emit("reply",selfServerId);
    }
  }, 10000);
})

eventEmitter.on("send reply",(req) => {
  if(wantToEnterCriticalSection===0 && insideCriticalSection===0)
  {
    io.to(req.serverId).emit("reply",selfServerId);
  }
  else
  {
    if(myTimeStamp > req.timeStamp)
    {
      io.to(req.serverId).emit("reply",selfServerId);
    }
    else
    {
      queue.push(req.serverId);
    }
  }
})


server1.on("reply",(serverId)=>{
  console.log("reply from server ",serverId);
  replyCount = replyCount + 1;
  if(replyCount===4)
  {
    eventEmitter.emit("acquire critical section");
  }
})

server2.on("reply",(serverId)=>{
  console.log("reply from server ",serverId);
  replyCount = replyCount + 1;
  if(replyCount===4)
  {
    eventEmitter.emit("acquire critical section");
  }
})

server3.on("reply",(serverId)=>{
  console.log("reply from server ",serverId);
  replyCount = replyCount + 1;
  if(replyCount===4)
  {
    eventEmitter.emit("acquire critical section");
  }
})

server5.on("reply",(serverId)=>{
  console.log("reply from server ",serverId);
  replyCount = replyCount + 1;
  if(replyCount===4)
  {
    eventEmitter.emit("acquire critical section");
  }
})


server1.on("request",(req)=>{
  console.log("request from server ",req.serverId);
  eventEmitter.emit("send reply",req);
})

server2.on("request",(req)=>{
  console.log("request from server ",req.serverId);
  eventEmitter.emit("send reply",req);
})

server3.on("request",(req)=>{
  console.log("request from server ",req.serverId);
  eventEmitter.emit("send reply",req);
})

server5.on("request",(req)=>{
  console.log("request from server ",req.serverId);
  eventEmitter.emit("send reply",req);
})

io.on('connection', socket => {
  socket.on('join', ( serverId ) => {
    socket.join(serverId);
    console.log('new socket connection with server ',serverId);
  })
});


http.listen(6000, function() {
  console.log('Food App Server ',selfServerId,' Listening On Port 3000');

  if(parseInt(process.argv[2])===1)
  {
    setTimeout(()=>{
       wantToEnterCriticalSection = 1;
       for(var i=1;i<=totalServers;i++)
       {
         if(i!=selfServerId)
         {
            var date = new Date();
            var data = {
              timeStamp:date,
              serverId:selfServerId
            }
            io.to(i).emit("request",data);
         }
       }
    },10000);
  }

});

