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
var users = [];

io.on("connection", (socket) => {
  socket.on("subscribe", (user_id) => {
    console.log("subscribe");
    if (user_id) {
      users.push({ userId: user_id, socketId: socket.id });
    }
    socket.broadcast.to(socket.id).emit("connected",{handshake_id:socket.id})
    console.log(users);
  });

  socket.on("new-call", (data) => {
    console.log("data", data);
    arr.push({
      id: data.id,
      username: data.username,
      avatar: data.avatar,
      channel_id: data.channel_id,
      time: data.time,
      sender: socket.id,
      sender_id: data.sender_id,
      reciever_id: data.reciever_id,
      slot: data.slot,
    });
    let temp = arr.filter((i) => i["reciever_id"] === data.reciever_id);
    let id_arr = users.filter((i) => i.userId === data.reciever_id);
    console.log("id_arr", id_arr);
    console.log("temp", temp);
    id_arr.map((id) => {
      socket.broadcast.to(id.socketId).emit("new_request", temp);
    });
  });

  socket.on("accept_call", (data) => {
    if (data.success) {
      console.log("sender", data.sender);
      socket.broadcast.to(data.sender).emit("stop_spinner", { success: data.success, reciever:socket.id });
    } else {
      socket.broadcast.to(data.sender)
        .emit("stop_spinner", { success: data.success });
    }
  });

  socket.on("remove", (data) => {
    console.log("remove",data);
    const index = arr.findIndex((i) => i.id === data.id);
    if (index > -1) {
      arr.splice(index, 1);
    }

    let temp = arr.filter((i) => i["reciever_id"] === data.reciever_id);
    let id_arr = users.filter((i) => i.userId === data.reciever_id);
    id_arr.map((id) => {
      socket.broadcast.to(id.socketId).emit("new_request", temp);
    });
});

  socket.on("disconnect_call", (data) => {
    if (data.sender) {
      socket.broadcast.to(data.sender).emit("cut_call", { success: data.success });
    }
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
    socket.broadcast.to(id).emit("payment_notification", count);
  });

  socket.on("unsubscribe", () => {
    console.log("unsubscribe");
    let Removeindex = users.findIndex((user) => user.socketId == socket.id);
    if (Removeindex > -1) {
      users.splice(Removeindex, 1);
    }
    console.log(users);
  });

  socket.on("disconnect", function () {});
});

server.listen(process.env.PORT || 3232, () => {
  console.log("Server is listening at 3232");
});
