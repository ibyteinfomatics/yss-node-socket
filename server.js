const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

var arr = [];

io.on("connection", (socket) => {
  socket.on("init_call", function (room) {
    socket.join(room);
  });

  socket.on("new-call", (room) => {
    socket.join(room.c_email);
    if (arr.filter( vendor => vendor['id'] === room.id ) == 0) {
      arr.push({ id: room.id, username: room.username });
    }
    socket.broadcast.to(room.c_email).emit("new_notification", arr);
  });

  socket.on("accept_call", (data) => {
    socket.broadcast
      .to(data.c_email)
      .emit("stop_spinner", { success: data.success });
  });

  socket.on("remove", (room) => {
    const index = arr.findIndex((i) => i.id === room.id);
    if (index > -1) {
      arr.splice(index, 1);
    }
    socket.broadcast.to(room.c_email).emit("new_notification", arr);
  });

  socket.on("decline_call", (data) => {
    if (!data) {
      socket.broadcast
        .to(data.c_email)
        .emit("deny_call", { success: data.success });
    }
  });

  socket.on("disconnect", function () {});
});

app.get("/", (req, res) => {
  res.send("<h1>Welcome to socket.yoursafespaceonline.com</h1>");
});

server.listen(process.env.PORT || 3232, () => {
  console.log("Server is listening at 3232");
});
