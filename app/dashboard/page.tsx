"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import ClientOnly from "../components/ClientOnly";

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if user is logged in
    const loggedIn = localStorage.getItem("agentLoggedIn") === "true";
    console.log(
      "Dashboard auth check - localStorage value:",
      localStorage.getItem("agentLoggedIn")
    );
    console.log("Dashboard auth check - loggedIn:", loggedIn);

    if (!loggedIn) {
      console.log("Not authenticated, redirecting to login...");
      // Use window.location instead of router for more reliable redirect
      window.location.href = "/login";
    } else {
      console.log("Authenticated, setting isAuthenticated to true");
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    // Update video elements when streams change
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const handleLogout = () => {
    localStorage.removeItem("agentLoggedIn");
    router.push("/login");
  };

  const startAgentCall = async () => {
    try {
      setStatus("Requesting camera and microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      setIsAgentActive(true);
      setStatus("Agent active - waiting for customer calls");

      // Initialize Socket.IO connection
      initializeSocket();

      console.log("Agent camera and microphone access granted");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setStatus("Error: Could not access camera or microphone");
    }
  };

  const stopAgentCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsAgentActive(false);
    setIsInCall(false);
    setStatus("Ready to start");
  };

  const initializeSocket = () => {
    console.log("🔌 Initializing Socket.IO connection...");
    const socket = io("https://socket-server-2jvv.onrender.com", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });
    socketRef.current = socket;

    // Log socket connection events
    socket.on("connect", () => {
      console.log("✅ Socket.IO connected successfully! Socket ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket.IO disconnected:", reason);
    });

    // Join as agent
    console.log("👨‍💼 Joining as agent...");
    socket.emit("agent-join");

    // Listen for customer availability
    socket.on("customer-available", () => {
      console.log("👤 Customer is available and waiting");
      setStatus(
        "Customer waiting - will connect automatically when they start call"
      );
    });

    // Listen for offer from customer
    socket.on(
      "offer",
      async (data: {
        offer: RTCSessionDescriptionInit;
        customerId: string;
      }) => {
        try {
          console.log("📥 Received offer from customer:", data.customerId);
          console.log("📥 Offer details:", data.offer);
          setStatus("Incoming call...");

          // Create peer connection
          console.log("🔗 Creating RTCPeerConnection for customer...");
          const peerConnection = new RTCPeerConnection(rtcConfig);
          peerConnectionRef.current = peerConnection;

          // Add local stream
          if (localStream) {
            console.log("🎤 Adding local stream to peer connection...");
            console.log("🎤 Local stream tracks:", localStream.getTracks());
            localStream.getTracks().forEach((track) => {
              console.log("🎤 Adding track:", track.kind, track.id);
              peerConnection.addTrack(track, localStream);
            });
          } else {
            console.error(
              "❌ No local stream available to add to peer connection"
            );
          }

          // Handle remote stream
          peerConnection.ontrack = (event) => {
            console.log(
              "📹 Remote stream received from customer:",
              event.streams[0]
            );
            setRemoteStream(event.streams[0]);
            setIsInCall(true);
            setStatus("Connected to customer");
          };

          // Handle ICE candidates
          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              console.log(
                "🧊 Sending ICE candidate to customer:",
                event.candidate
              );
              socket.emit("ice-candidate", {
                candidate: event.candidate,
                targetId: data.customerId,
              });
            } else {
              console.log("✅ ICE gathering complete");
            }
          };

          // Handle connection state changes
          peerConnection.onconnectionstatechange = () => {
            console.log(
              "🔗 Connection state changed:",
              peerConnection.connectionState
            );
            if (peerConnection.connectionState === "connected") {
              setStatus("Connected to customer");
            } else if (peerConnection.connectionState === "disconnected") {
              setStatus("Customer disconnected");
              setIsInCall(false);
              setRemoteStream(null);
            } else if (peerConnection.connectionState === "failed") {
              console.error("❌ WebRTC connection failed");
              setStatus("Connection failed");
            }
          };

          // Handle ICE connection state changes
          peerConnection.oniceconnectionstatechange = () => {
            console.log(
              "🧊 ICE connection state:",
              peerConnection.iceConnectionState
            );
          };

          // Set remote description and create answer
          console.log("📥 Setting remote description from customer offer...");
          await peerConnection.setRemoteDescription(data.offer);
          console.log("📤 Creating answer for customer...");
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log("📤 Sending answer to customer:", answer);

          socket.emit("answer", {
            answer,
            customerId: data.customerId,
          });
        } catch (error) {
          console.error("❌ Error handling offer:", error);
          setStatus("Error: Could not establish connection");
        }
      }
    );

    // Listen for ICE candidates from customer
    socket.on(
      "ice-candidate",
      async (data: { candidate: RTCIceCandidateInit; fromId: string }) => {
        console.log("📥 Received ICE candidate from customer:", data.fromId);
        console.log("📥 ICE candidate details:", data.candidate);
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(data.candidate);
            console.log("✅ ICE candidate added successfully");
          } catch (error) {
            console.error("❌ Error adding ICE candidate:", error);
          }
        }
      }
    );

    // Listen for call end
    socket.on("call-ended", () => {
      console.log("📞 Call ended by customer");
      setStatus("Call ended by customer");
      setIsInCall(false);
      setRemoteStream(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    console.log("✅ Socket.IO initialization complete");
  };

  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("end-call");
    }
    setIsInCall(false);
    setRemoteStream(null);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setStatus("Agent active - waiting for customer calls");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Support Agent Dashboard
                </h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Agent Controls */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Agent Controls
                </h2>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Status
                    </h3>
                    <p className="text-sm text-gray-600">{status}</p>
                  </div>

                  {!isAgentActive ? (
                    <button
                      onClick={startAgentCall}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      🎥 Start Agent Call
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={stopAgentCall}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        🛑 Stop Agent Call
                      </button>
                      {isInCall && (
                        <button
                          onClick={endCall}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                          📞 End Current Call
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Local Video Preview
                </h2>

                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {localStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <p>No video stream</p>
                        <p className="text-sm">
                          Start agent call to see preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Remote Video (Customer) */}
            {isInCall && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Customer Video
                </h2>

                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">👤</div>
                        <p>Connecting to customer...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call Status */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Call Status
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      isAgentActive
                        ? isInCall
                          ? "bg-green-500"
                          : "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      {isInCall
                        ? "In Call with Customer"
                        : isAgentActive
                        ? "Agent Active"
                        : "Agent Inactive"}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {isInCall
                        ? "Live support call in progress"
                        : isAgentActive
                        ? "Ready to receive customer calls"
                        : 'Click "Start Agent Call" to begin accepting calls'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ClientOnly>
  );
}
