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
    console.log("🔌 Client connected:", socket.id);

    // Handle customer joining
    socket.on("customer-join", () => {
      console.log("👤 Customer joined:", socket.id);
      activeConnections.set(socket.id, { type: "customer", socket });

      // Notify agent if available
      const agent = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "agent"
      );
      if (agent) {
        console.log("📢 Notifying agent of available customer");
        agent.socket.emit("customer-available");
      } else {
        console.log("⚠️ No agent available for customer");
      }
    });

    // Handle agent joining
    socket.on("agent-join", () => {
      console.log("👨‍💼 Agent joined:", socket.id);
      activeConnections.set(socket.id, { type: "agent", socket });

      // Notify agent of any waiting customers
      const waitingCustomer = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "customer"
      );
      if (waitingCustomer) {
        console.log("📢 Notifying agent of waiting customer");
        socket.emit("customer-available");
      } else {
        console.log("ℹ️ No waiting customers for agent");
      }
    });

    // Handle WebRTC offer from customer
    socket.on("offer", (offer) => {
      console.log("📤 Offer received from customer:", socket.id);
      console.log("📤 Offer details:", offer);

      const agent = Array.from(activeConnections.values()).find(
        (conn) => conn.type === "agent"
      );
      if (agent) {
        console.log("📤 Forwarding offer to agent:", agent.socket.id);
        agent.socket.emit("offer", { offer, customerId: socket.id });
      } else {
        console.error("❌ No agent available to receive offer");
      }
    });

    // Handle WebRTC answer from agent
    socket.on("answer", (data) => {
      console.log("📤 Answer received from agent:", socket.id);
      console.log("📤 Answer details:", data.answer);
      console.log("📤 Target customer:", data.customerId);

      const customer = activeConnections.get(data.customerId);
      if (customer) {
        console.log("📤 Forwarding answer to customer:", data.customerId);
        customer.socket.emit("answer", data.answer);
      } else {
        console.error("❌ Customer not found for answer:", data.customerId);
      }
    });

    // Handle ICE candidates
    socket.on("ice-candidate", (data) => {
      console.log("🧊 ICE candidate received from:", socket.id);
      console.log("🧊 Target ID:", data.targetId);
      console.log("🧊 Candidate details:", data.candidate);

      let targetConnection;

      // Handle case where customer sends "agent" as targetId
      if (data.targetId === "agent") {
        targetConnection = Array.from(activeConnections.values()).find(
          (conn) => conn.type === "agent"
        );
        if (targetConnection) {
          console.log(
            "🧊 Found agent for customer ICE candidate:",
            targetConnection.socket.id
          );
        }
      } else {
        // Handle case where agent sends actual customer socket ID
        targetConnection = activeConnections.get(data.targetId);
      }

      if (targetConnection) {
        console.log(
          "🧊 Forwarding ICE candidate to:",
          targetConnection.socket.id
        );
        targetConnection.socket.emit("ice-candidate", {
          candidate: data.candidate,
          fromId: socket.id,
        });
      } else {
        console.error(
          "❌ Target connection not found for ICE candidate:",
          data.targetId
        );
        console.log(
          "Available connections:",
          Array.from(activeConnections.keys())
        );
      }
    });

    // Handle call end
    socket.on("end-call", () => {
      console.log("📞 Call ended by:", socket.id);
      const connection = activeConnections.get(socket.id);
      if (connection) {
        // Notify the other party
        const otherConnections = Array.from(activeConnections.values()).filter(
          (conn) => conn.socket.id !== socket.id
        );
        otherConnections.forEach((conn) => {
          console.log("📞 Notifying other party of call end:", conn.socket.id);
          conn.socket.emit("call-ended");
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
      const connection = activeConnections.get(socket.id);
      if (connection) {
        // Notify the other party
        const otherConnections = Array.from(activeConnections.values()).filter(
          (conn) => conn.socket.id !== socket.id
        );
        otherConnections.forEach((conn) => {
          console.log(
            "📞 Notifying other party of disconnect:",
            conn.socket.id
          );
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
