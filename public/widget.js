(function () {
  "use strict";

  // Create widget styles
  const widgetStyles = `
        .support-widget {
            position: fixed;
            bottom: 100px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 15px 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .support-widget:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        
        .support-widget:active {
            transform: translateY(0);
        }
        
        .support-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .support-modal.active {
            display: flex;
        }
        
        .support-modal-content {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .support-modal h3 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 20px;
        }
        
        .support-modal p {
            margin: 0 0 20px 0;
            color: #666;
            line-height: 1.5;
        }
        
        .support-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .support-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .support-btn.primary {
            background: #667eea;
            color: white;
        }
        
        .support-btn.primary:hover {
            background: #5a6fd8;
        }
        
        .support-btn.secondary {
            background: #e5e7eb;
            color: #374151;
        }
        
        .support-btn.secondary:hover {
            background: #d1d5db;
        }
        
        .support-btn.danger {
            background: #ef4444;
            color: white;
        }
        
        .support-btn.danger:hover {
            background: #dc2626;
        }
        
        .support-btn.muted {
            background: #6b7280;
            color: white;
        }
        
        .support-btn.muted:hover {
            background: #4b5563;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-indicator.connecting {
            background: #f59e0b;
            animation: pulse 1.5s infinite;
        }
        
        .status-indicator.connected {
            background: #10b981;
        }
        
        .status-indicator.error {
            background: #ef4444;
        }
        
        .debug-panel {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
            text-align: left;
            font-family: monospace;
            font-size: 12px;
            max-height: 150px;
            overflow-y: auto;
        }
        
        .debug-panel h4 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 14px;
        }
        
        .debug-log {
            color: #6c757d;
            margin: 2px 0;
        }
        
        .agent-video-container {
            margin-top: 20px;
            text-align: center;
        }
        
        .agent-video-container video {
            border: 2px solid #e5e7eb;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;

  // Inject styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = widgetStyles;
  document.head.appendChild(styleSheet);

  // Widget state
  let localStream = null;
  let isMuted = false;
  let peerConnection = null;
  let socket = null;

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize WebRTC and Socket.IO
  async function initializeWebRTC() {
    try {
      console.log("🔄 Initializing WebRTC connection...");

      // Load Socket.IO client
      if (typeof io === "undefined") {
        console.log("📦 Loading Socket.IO client...");
        await loadScript("https://cdn.socket.io/4.7.2/socket.io.min.js");
      }

      // Connect to signaling server
      console.log("🔌 Connecting to Socket.IO server...");
      socket = io("https://socket-server-2jvv.onrender.com", {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      // Log socket connection events
      socket.on("connect", () => {
        console.log(
          "✅ Socket.IO connected successfully! Socket ID:",
          socket.id
        );
        logDebug(`Socket.IO connected (ID: ${socket.id})`);
        statusMessage.innerHTML =
          '<span class="status-indicator connecting"></span>Connected to server, waiting for agent...';
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket.IO connection error:", error);
        logDebug(`Socket.IO connection error: ${error.message}`);
        statusMessage.innerHTML =
          '<span class="status-indicator error"></span>Failed to connect to server';
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 Socket.IO disconnected:", reason);
        logDebug(`Socket.IO disconnected: ${reason}`);
        statusMessage.innerHTML =
          '<span class="status-indicator error"></span>Disconnected from server';
      });

      // Join as customer
      console.log("👤 Joining as customer...");
      logDebug("Joining as customer...");
      socket.emit("customer-join");

      // Create RTCPeerConnection
      console.log("🔗 Creating RTCPeerConnection...");
      logDebug("Creating RTCPeerConnection...");
      peerConnection = new RTCPeerConnection(rtcConfig);

      // Add local stream to peer connection
      if (localStream) {
        console.log("🎤 Adding local stream to peer connection...");
        logDebug("Adding local stream to peer connection...");
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        console.log("📹 Remote stream received:", event.streams[0]);
        console.log("📹 Remote stream tracks:", event.streams[0]?.getTracks());
        logDebug("Remote stream received from agent");
        statusMessage.innerHTML =
          '<span class="status-indicator connected"></span>Connected to agent!';

        // Set the remote stream to the video element
        const agentVideo = document.getElementById("agent-video");
        const agentVideoContainer = document.getElementById(
          "agent-video-container"
        );
        if (agentVideo && event.streams[0]) {
          agentVideo.srcObject = event.streams[0];
          agentVideoContainer.style.display = "block";
          logDebug("Agent video stream attached to video element");

          // Log track information
          const tracks = event.streams[0].getTracks();
          tracks.forEach((track) => {
            console.log("📹 Received track:", track.kind, track.id);
            logDebug(`Received ${track.kind} track from agent`);
          });
        } else {
          console.error("❌ No video element or stream available");
          logDebug("Error: No video element or stream available");
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 Sending ICE candidate:", event.candidate);
          logDebug("Sending ICE candidate to agent");
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            targetId: "agent", // We'll need to get the actual agent ID
          });
        } else {
          console.log("✅ ICE gathering complete");
          logDebug("ICE gathering complete");
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(
          "🔗 Connection state changed:",
          peerConnection.connectionState
        );
        logDebug(`WebRTC connection state: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === "connected") {
          statusMessage.innerHTML =
            '<span class="status-indicator connected"></span>Connected to agent';
        } else if (peerConnection.connectionState === "disconnected") {
          statusMessage.innerHTML =
            '<span class="status-indicator error"></span>Connection lost';
        } else if (peerConnection.connectionState === "failed") {
          console.error("❌ WebRTC connection failed");
          logDebug("WebRTC connection failed");
          statusMessage.innerHTML =
            '<span class="status-indicator error"></span>Connection failed';
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          "🧊 ICE connection state:",
          peerConnection.iceConnectionState
        );
        logDebug(`ICE connection state: ${peerConnection.iceConnectionState}`);
      };

      // Create and send offer
      console.log("📤 Creating WebRTC offer...");
      logDebug("Creating WebRTC offer...");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("📤 Sending offer to agent:", offer);
      logDebug("Sending offer to agent");
      socket.emit("offer", offer);

      // Listen for answer
      socket.on("answer", async (answer) => {
        console.log("📥 Received answer from agent:", answer);
        logDebug("Received answer from agent");
        try {
          await peerConnection.setRemoteDescription(answer);
          console.log("✅ Remote description set successfully");
          logDebug("Remote description set successfully");
        } catch (error) {
          console.error("❌ Error setting remote description:", error);
          logDebug(`Error setting remote description: ${error.message}`);
        }
      });

      // Listen for ICE candidates from agent
      socket.on("ice-candidate", async (data) => {
        console.log("📥 Received ICE candidate from agent:", data);
        logDebug("Received ICE candidate from agent");
        if (data.candidate) {
          try {
            await peerConnection.addIceCandidate(data.candidate);
            console.log("✅ ICE candidate added successfully");
            logDebug("ICE candidate added successfully");
          } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
            logDebug(`Error adding ICE candidate: ${error.message}`);
          }
        }
      });

      // Listen for call end
      socket.on("call-ended", () => {
        console.log("📞 Call ended by agent");
        logDebug("Call ended by agent");
        resetCall();
        statusMessage.innerHTML =
          '<span class="status-indicator error"></span>Call ended by agent';
      });

      console.log("✅ WebRTC initialization complete");
      logDebug("WebRTC initialization complete");
    } catch (error) {
      console.error("❌ Error initializing WebRTC:", error);
      throw error;
    }
  }

  // Load external script
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Debug logging function
  function logDebug(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement("div");
    logEntry.className = "debug-log";
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugLogs.appendChild(logEntry);
    debugLogs.scrollTop = debugLogs.scrollHeight;
  }

  // Create widget button
  const widgetButton = document.createElement("button");
  widgetButton.className = "support-widget";
  widgetButton.innerHTML = "🎥 Live Video Call";

  // Create modal
  const modal = document.createElement("div");
  modal.className = "support-modal";
  modal.innerHTML = `
        <div class="support-modal-content">
            <h3>Live Support Call</h3>
            <p id="status-message">Click "Start Call" to begin...</p>
            <div class="support-controls" id="call-controls">
                <button class="support-btn primary" id="start-call">Start Call</button>
                <button class="support-btn secondary" id="close-modal">Cancel</button>
            </div>
            <div class="support-controls" id="active-controls" style="display: none;">
                <button class="support-btn muted" id="mute-btn">🔇 Mute</button>
                <button class="support-btn danger" id="end-call">End Call</button>
            </div>
            <div class="agent-video-container" id="agent-video-container" style="display: none;">
                <video id="agent-video" autoplay playsinline style="width: 100%; max-width: 300px; border-radius: 8px;"></video>
            </div>
            <div class="debug-panel" id="debug-panel" style="display: none;">
                <h4>Debug Info</h4>
                <div id="debug-logs"></div>
            </div>
        </div>
    `;

  // Get modal elements
  const statusMessage = modal.querySelector("#status-message");
  const callControls = modal.querySelector("#call-controls");
  const activeControls = modal.querySelector("#active-controls");
  const startCallBtn = modal.querySelector("#start-call");
  const closeModalBtn = modal.querySelector("#close-modal");
  const muteBtn = modal.querySelector("#mute-btn");
  const endCallBtn = modal.querySelector("#end-call");
  const debugPanel = modal.querySelector("#debug-panel");
  const debugLogs = modal.querySelector("#debug-logs");

  // Add click handler to widget button
  widgetButton.addEventListener("click", function () {
    modal.classList.add("active");
  });

  // Close modal
  closeModalBtn.addEventListener("click", function () {
    modal.classList.remove("active");
    resetCall();
  });

  // Start call
  startCallBtn.addEventListener("click", async function () {
    try {
      logDebug("Starting call...");
      statusMessage.innerHTML =
        '<span class="status-indicator connecting"></span>Requesting microphone access...';

      // Request microphone access
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      logDebug("Microphone access granted");

      // Initialize WebRTC and Socket.IO
      await initializeWebRTC();

      statusMessage.innerHTML =
        '<span class="status-indicator connecting"></span>Connecting to agent...';
      callControls.style.display = "none";
      activeControls.style.display = "flex";
      debugPanel.style.display = "block";

      console.log("Microphone access granted and WebRTC initialized");
      logDebug("Call initialization complete");
    } catch (error) {
      console.error("Error starting call:", error);
      logDebug(`Error starting call: ${error.message}`);
      statusMessage.innerHTML =
        '<span class="status-indicator error"></span>Error: Could not start call';
    }
  });

  // Mute/unmute
  muteBtn.addEventListener("click", function () {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMuted = !audioTrack.enabled;
        muteBtn.innerHTML = isMuted ? "🔊 Unmute" : "🔇 Mute";
        muteBtn.className = isMuted
          ? "support-btn primary"
          : "support-btn muted";
      }
    }
  });

  // End call
  endCallBtn.addEventListener("click", function () {
    if (socket) {
      socket.emit("end-call");
    }
    resetCall();
    modal.classList.remove("active");
  });

  // Reset call state
  function resetCall() {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    isMuted = false;
    statusMessage.innerHTML = 'Click "Start Call" to begin...';
    callControls.style.display = "flex";
    activeControls.style.display = "none";
    debugPanel.style.display = "none";
    muteBtn.innerHTML = "🔇 Mute";
    muteBtn.className = "support-btn muted";

    // Reset agent video
    const agentVideo = document.getElementById("agent-video");
    const agentVideoContainer = document.getElementById(
      "agent-video-container"
    );
    if (agentVideo) {
      agentVideo.srcObject = null;
    }
    if (agentVideoContainer) {
      agentVideoContainer.style.display = "none";
    }
  }

  // Handle page unload
  window.addEventListener("beforeunload", function () {
    if (socket) {
      socket.emit("end-call");
    }
  });

  // Append elements to body
  document.body.appendChild(widgetButton);
  document.body.appendChild(modal);

  console.log("Support widget loaded successfully!");
})();
