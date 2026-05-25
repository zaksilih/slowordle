"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registracija uspešna, a prijava ni uspela. Poskusite se prijaviti.");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Napaka pri registraciji");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm relative">
        <Link href="/" className="absolute -top-2 right-0 text-gray-400 hover:text-white text-2xl leading-none" aria-label="Zapri">
          &times;
        </Link>
        <h1 className="text-2xl font-bold text-center mb-8">Registracija</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Uporabniško ime
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              placeholder="npr. janez_novak"
            />
            <p className="text-xs text-gray-500 mt-1">3-20 znakov, samo črke, številke in _</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Geslo
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Najmanj 6 znakov</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
          >
            {isLoading ? "Registracija..." : "Registriraj se"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Že imaš račun?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300">
            Prijavi se
          </Link>
        </p>
      </div>
    </div>
  );
}
