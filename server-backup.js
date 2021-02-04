const express = require("express")
const cors = require("cors")

const app = express();
app.use(cors());

const server = require('http').Server(app);
const io = require('socket.io')(server,{
  cors: {
    origin: "*",
  }});

let arr = [];
io.on("connection", (socket)=> {
  socket.on("init_call", function (room) {
    socket.join(room);
  });

  socket.on("new-call", (room) => {
    socket.join(room.c_email);
    if(!arr.includes(room.username)){
      arr.push(room.username);
    }
    socket.broadcast.to(room.c_email).emit("new_notification", arr);
  });

  socket.on("remove", (room) => {
    const index = arr.indexOf(room.username);
    if (index > -1 && arr.includes(room.username)) {
      arr.splice(index, 1);
    }
    console.log(arr);
    socket.broadcast.to(room.c_email).emit("new_notification", arr);
  });

  socket.on("disconnect", function () {});
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(process.env.PORT||3232,()=>{
  console.log('Server is listening at 3232');
})

