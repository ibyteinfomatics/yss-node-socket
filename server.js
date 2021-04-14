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
var notifications = { data: [], last_page: 0, currentPage: 1, totalPage: [] };

io.on("connection", (socket) => {
  socket.on("init_call", function (room) {
    socket.join(room);
  });

  socket.on("new-call", (room) => {
    if (arr.filter((vendor) => vendor["id"] === room.id).length === 0) {
      socket.join(room.room_id);
      arr.push({ id: room.id, username: room.username, avatar:room.avatar, channel:room.room_id});
      let temp = arr.filter((i) => i["id"] === room.id);
      socket.broadcast.to(room.room_id).emit("new_request", temp);
    }
  });
  
  socket.on("accept_call", (data) => {
    socket.broadcast
      .to(data.room_id)
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
    console.log(data);
    if (data) {
      socket.broadcast
        .to(data.room_id)
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
    } catch (e) {
      console.log(e);
    }
    io.to(id).emit("payment_notification", count);
  });

  socket.on("disconnect", function () {});

});

server.listen(process.env.PORT || 3232, () => {
  console.log("Server is listening at 3232");
});
