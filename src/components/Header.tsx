"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  puzzleNumber?: number;
  username?: string | null;
}

export default function Header({ puzzleNumber, username }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold tracking-wider">SLOWORDLE</h1>
          {puzzleNumber != null && (
            <span className="text-xs text-gray-400">št. {puzzleNumber}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {username ? (
            <span className="text-xs text-gray-400 hidden sm:inline">{username}</span>
          ) : (
            <Link
              href="/login"
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
            >
              Prijava
            </Link>
          )}
        </div>
      </header>

      {menuOpen && (
        <nav className="border-b border-gray-700 bg-gray-800 px-4 py-3 flex flex-col gap-2">
          {!username && (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
                Prijava
              </Link>
              <Link href="/register" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
                Registracija
              </Link>
            </>
          )}
          <Link href="/stats" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
            Statistika
          </Link>
          <Link href="/scoreboard" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
            Lestvica
          </Link>
          <Link href="/groups" className="text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
            Skupine
          </Link>
          {username && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-left text-gray-300 hover:text-white"
            >
              Odjava ({username})
            </button>
          )}
        </nav>
      )}
    </>
  );
}
