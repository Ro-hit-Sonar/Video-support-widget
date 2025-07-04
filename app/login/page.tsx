"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Debug logging
    console.log("Login attempt:", { username, password });
    setDebugInfo(
      `Attempting login with username: "${username}" and password: "${password}"`
    );

    if (username === "agent" && password === "1234") {
      console.log("Login successful, setting localStorage and redirecting...");
      setDebugInfo("Login successful! Setting localStorage and redirecting...");

      // Store login state (in a real app, you'd use proper session management)
      localStorage.setItem("agentLoggedIn", "true");

      // Verify localStorage was set
      const stored = localStorage.getItem("agentLoggedIn");
      console.log("localStorage verification:", stored);
      setDebugInfo(`localStorage set to: "${stored}"`);

      // Add a small delay to see the debug info
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      console.log("Login failed - credentials do not match");
      setError("Invalid credentials. Use username: agent, password: 1234");
      setDebugInfo("Login failed - credentials do not match expected values");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Support Agent Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {debugInfo && (
            <div className="text-blue-600 text-sm text-center bg-blue-50 p-2 rounded">
              Debug: {debugInfo}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p>
            Username: <strong>agent</strong>
          </p>
          <p>
            Password: <strong>1234</strong>
          </p>
        </div>

        {/* Debug section */}
        <div className="text-center text-xs text-gray-400 bg-gray-100 p-2 rounded">
          <p>
            Current localStorage value:{" "}
            {typeof window !== "undefined"
              ? localStorage.getItem("agentLoggedIn") || "null"
              : "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
}
