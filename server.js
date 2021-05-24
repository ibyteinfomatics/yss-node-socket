const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
const API = "https://admin.soberlistic.com/api"; 
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

var arr = [];
var loggedInUsers = [];

io.on("connection", (socket) => {
  socket.on("subscribe", function (room) {
      
    socket.join(room);
      console.log(room,' joined with ',socket.id);
      loggedInUsers.push(room)
  });

  socket.on("new-call", (room) => {
    if (arr.filter((vendor) => vendor["id"] === room.id).length === 0) {  
      arr.push({
        id: room.id,
        username: room.username,
        avatar: room.avatar,
        channel_id: room.channel_id,
        time: room.time,
        sender:room.sender,
        sender_id: room.sender_id
      });
      let temp = arr.filter((i) => i["id"] === room.id);
      socket.broadcast.to(room.room_id).emit("new_request", temp);
    }
  });

  socket.on("accept_call", (data) => {
    socket.broadcast
      .to(data.sender)
      .emit("stop_spinner", { success: data.success });
  });

  socket.on("remove", (room) => {
    const index = arr.findIndex((i) => i.id === room.id);
    if (index > -1) {
      arr.splice(index, 1);
    }
    let temp = arr.filter((i) => i["id"] === room.id);
    socket.broadcast.to(room.room_id).emit("new_request", temp);
  });

  socket.on("disconnect_call", (data) => {
    if (data) {
      socket.broadcast
        .to(data.sender)
        .emit("cut_call", { success: data.success });
    }
  });

  socket.on("join-notification", (id) => {
    socket.join(id);
  });

  socket.on("payment_success", async (data) => {
    let id = parseInt(data.id);
    let count = 0;
      try {
        let result = await fetch(`${API}/get/user/notification?user_id=${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/vnd.api+json; charset=utf-8",
            Accept: "application/json",
          },
        });
        let response = await result.json();
        if (response.success) {
          response.data.map((item) => {
            if (item.is_read == 0) {
              count++;
            }
          });
        }
      } 
      catch (e) {
        console.log(e);
      }
    io.to(id).emit("payment_notification", count);
  });

  socket.on('unsubscribe',(room)=>{
    if(loggedInUsers.includes(room)){
      socket.leave(room)
      loggedInUsers=loggedInUsers.filter(i=>i!=room)
    }

  })

  socket.on("disconnect", function () {});
});

server.listen(process.env.PORT || 3232, () => {
  console.log("Server is listening at 3232");
});
