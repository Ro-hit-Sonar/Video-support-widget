"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";

export default function TestPage() {
  const [socketStatus, setSocketStatus] = useState("Not connected");
  const [widgetStatus, setWidgetStatus] = useState("Not loaded");
  const [webrtcSupport, setWebrtcSupport] = useState("Checking...");

  useEffect(() => {
    // Check if widget is loaded
    const checkWidget = () => {
      if (document.querySelector(".support-widget")) {
        setWidgetStatus("Widget loaded successfully");
      } else {
        setWidgetStatus("Widget not found");
      }
    };

    // Check if Socket.IO is available
    const checkSocketIO = () => {
      if (typeof window !== "undefined" && "io" in window) {
        setSocketStatus("Socket.IO available");
      } else {
        setSocketStatus("Socket.IO not available");
      }
    };

    // Check WebRTC support
    const checkWebRTC = () => {
      if (typeof window !== "undefined" && window.RTCPeerConnection) {
        setWebrtcSupport("Supported");
      } else {
        setWebrtcSupport("Not Supported");
      }
    };

    // Check after a short delay to allow scripts to load
    setTimeout(() => {
      checkWidget();
      checkSocketIO();
      checkWebRTC();
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Script src="/widget.js" strategy="afterInteractive" />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          WebRTC Support Widget Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Widget Status:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    widgetStatus.includes("successfully")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {widgetStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Socket.IO Status:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    socketStatus.includes("available")
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {socketStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">WebRTC Support:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    webrtcSupport === "Supported"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {webrtcSupport}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test Instructions
            </h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  1. Customer Test
                </h3>
                <p>
                  Look for the floating 🎥 Live Support button on the
                  bottom-right. Click it to test the widget.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  2. Agent Test
                </h3>
                <p>
                  Navigate to{" "}
                  <a href="/login" className="text-blue-600 hover:underline">
                    /login
                  </a>{" "}
                  and use:
                </p>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>
                    Username:{" "}
                    <code className="bg-gray-100 px-1 rounded">agent</code>
                  </li>
                  <li>
                    Password:{" "}
                    <code className="bg-gray-100 px-1 rounded">1234</code>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Full Test</h3>
                <p>
                  Open two browser windows - one as customer (this page) and one
                  as agent (dashboard) to test the full WebRTC connection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Navigation
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Home Page
            </Link>
            <a
              href="/login"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Agent Login
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Agent Dashboard
            </a>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Technical Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Frontend</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Next.js 15 with App Router</li>
                <li>• React 19 + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Socket.IO Client</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Backend</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Custom Node.js server</li>
                <li>• Socket.IO for signaling</li>
                <li>• WebRTC peer connections</li>
                <li>• STUN servers for NAT traversal</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Real-time audio communication</li>
                <li>• Agent authentication</li>
                <li>• Mute/unmute controls</li>
                <li>• Automatic connection handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
