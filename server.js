const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Create Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store active connections
  const activeConnections = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle customer joining
    socket.on("customer-join", () => {
      console.log("Customer joined:", socket.id);
      activeConnections.set(socket.id, { type: "customer", socket });

      // Notify agent if available
      const agent = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "agent"
      );
      if (agent) {
        agent.socket.emit("customer-available");
      }
    });

    // Handle agent joining
    socket.on("agent-join", () => {
      console.log("Agent joined:", socket.id);
      activeConnections.set(socket.id, { type: "agent", socket });

      // Notify agent of any waiting customers
      const waitingCustomer = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "customer"
      );
      if (waitingCustomer) {
        socket.emit("customer-available");
      }
    });

    // Handle WebRTC offer from customer
    socket.on("offer", (offer) => {
      console.log("Offer received from customer");
      const agent = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "agent"
      );
      if (agent) {
        agent.socket.emit("offer", { offer, customerId: socket.id });
      }
    });

    // Handle WebRTC answer from agent
    socket.on("answer", (data) => {
      console.log("Answer received from agent");
      const customer = activeConnections.get(data.customerId);
      if (customer) {
        customer.socket.emit("answer", data.answer);
      }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", (data) => {
      console.log("ICE candidate received");
      const targetConnection = activeConnections.get(data.targetId);
      if (targetConnection) {
        targetConnection.socket.emit("ice-candidate", {
          candidate: data.candidate,
          fromId: socket.id,
        });
      }
    });

    // Handle call end
    socket.on("end-call", () => {
      console.log("Call ended by:", socket.id);
      const connection = activeConnections.get(socket.id);
      if (connection) {
        // Notify the other party
        const otherConnections = Array.from(activeConnections.values()).filter(
          (conn) => conn.socket.id !== socket.id
        );
        otherConnections.forEach((conn) => {
          conn.socket.emit("call-ended");
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const connection = activeConnections.get(socket.id);
      if (connection) {
        // Notify the other party
        const otherConnections = Array.from(activeConnections.values()).filter(
          (conn) => conn.socket.id !== socket.id
        );
        otherConnections.forEach((conn) => {
          conn.socket.emit("call-ended");
        });
        activeConnections.delete(socket.id);
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
