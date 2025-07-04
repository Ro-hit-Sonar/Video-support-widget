"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DebugLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [localStorageValue, setLocalStorageValue] = useState<string>("");
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog("Debug login page loaded");
    addLog(
      `localStorage available: ${
        typeof window !== "undefined" && window.localStorage ? "Yes" : "No"
      }`
    );

    if (typeof window !== "undefined") {
      const currentValue = localStorage.getItem("agentLoggedIn");
      setLocalStorageValue(currentValue || "null");
      addLog(`Current localStorage value: "${currentValue}"`);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog("Form submitted");
    addLog(`Username entered: "${username}"`);
    addLog(`Password entered: "${password}"`);
    addLog(`Username length: ${username.length}`);
    addLog(`Password length: ${password.length}`);

    // Check for exact match
    const usernameMatch = username === "agent";
    const passwordMatch = password === "1234";

    addLog(`Username matches 'agent': ${usernameMatch}`);
    addLog(`Password matches '1234': ${passwordMatch}`);

    if (usernameMatch && passwordMatch) {
      addLog("Credentials match! Setting localStorage...");

      try {
        localStorage.setItem("agentLoggedIn", "true");
        const stored = localStorage.getItem("agentLoggedIn");
        addLog(`localStorage set successfully: "${stored}"`);
        setLocalStorageValue(stored || "null");

        addLog("Attempting to redirect to dashboard...");
        setTimeout(() => {
          addLog("Redirecting now...");
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        addLog(`Error setting localStorage: ${error}`);
      }
    } else {
      addLog("Credentials do not match expected values");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("agentLoggedIn");
    setLocalStorageValue("null");
    addLog("localStorage cleared");
  };

  const testDirectAccess = () => {
    addLog("Testing direct dashboard access...");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Debug Login Page
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Login Form
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter 'agent'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter '1234'"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Login
              </button>
            </form>

            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">
                <strong>Expected credentials:</strong>
                <br />
                Username: <code className="bg-white px-1 rounded">agent</code>
                <br />
                Password: <code className="bg-white px-1 rounded">1234</code>
              </p>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Debug Information
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  localStorage Status
                </h3>
                <p className="text-sm text-gray-600">
                  Current value:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {localStorageValue}
                  </code>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearLogs}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Clear Logs
                  </button>
                  <button
                    onClick={clearLocalStorage}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Clear localStorage
                  </button>
                  <button
                    onClick={testDirectAccess}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Test Dashboard Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debug Logs
          </h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">
                No logs yet. Try submitting the form.
              </p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
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
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Home
            </Link>
            <a
              href="/login"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Original Login
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Dashboard
            </a>
            <a
              href="/test"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
