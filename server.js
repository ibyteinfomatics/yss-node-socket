const express = require("express")
const http= require('http')
const cors = require("cors")
const socket = require("socket.io")

const port = process.env.PORT || 3232;

const app = express();

const server = http.Server(app);
const io = socket(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors());

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

io.listen(port,()=>{
  console.log(`Socket PORT is listening at ${port}`);
});
