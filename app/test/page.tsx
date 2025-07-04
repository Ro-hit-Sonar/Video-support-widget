"use client";

import { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Clean up
      const existingScript = document.querySelector('script[src="/widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          WebRTC Support Widget Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Testing Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              Open the agent dashboard in another tab:{" "}
              <a
                href="/dashboard"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                /dashboard
              </a>
            </li>
            <li>Login as an agent and click Start Agent Call</li>
            <li>
              Come back to this page and click the 🎥 Live Video Call button
            </li>
            <li>Click Start Call in the widget</li>
            <li>
              Check the browser console and debug panel for connection logs
            </li>
          </ol>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>✅ Updated:</strong> Now using deployed Socket.IO server
              on Render for reliable WebRTC signaling.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Connection Status
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">
              The support widget should appear as a floating button in the
              bottom-right corner. Click it to test the WebRTC connection with
              an agent.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Debug Information
          </h3>
          <p className="text-blue-700 text-sm">
            Open your browser&apos;s developer console (F12) to see detailed
            connection logs. The widget also includes a debug panel that will
            show real-time connection status.
          </p>
        </div>
      </div>
    </div>
  );
}
