"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ScoreEntry {
  userId: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  streak: number;
  winRate: number;
}

interface GroupInfo {
  id: string;
  name: string;
}

const PERIODS = [
  { value: "daily", label: "Danes" },
  { value: "weekly", label: "Teden" },
  { value: "monthly", label: "Mesec" },
  { value: "yearly", label: "Leto" },
  { value: "alltime", label: "Skupaj" },
];

export default function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [activeTab, setActiveTab] = useState("global");
  const [period, setPeriod] = useState("weekly");
  const [myRank, setMyRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myUserId, setMyUserId] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchScoreboard = useCallback(async (tab: string, p: string) => {
    setLoading(true);
    try {
      let url: string;
      if (tab === "global") {
        url = `/api/scoreboard?period=${p}`;
      } else {
        url = `/api/groups/${tab}/scoreboard?period=${p}`;
      }

      const res = await fetch(url);
      if (res.status === 401) {
        setError("Za ogled lestvice se morate prijaviti.");
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setScoreboard(data.scoreboard);
        if (data.myRank) setMyRank(data.myRank);
        setError("");
      }
    } catch {
      setError("Napaka pri nalaganju lestvice.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoreboard(activeTab, period);
  }, [activeTab, period, fetchScoreboard]);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        if (data.myUserId) setMyUserId(data.myUserId);
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-gray-400 hover:text-white">
          ← Nazaj
        </Link>
        <h1 className="text-xl font-bold">Lestvica</h1>
        <div className="w-16"></div>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">{error}</p>
          <Link href="/login" className="text-green-400 hover:text-green-300">
            Prijavi se →
          </Link>
        </div>
      )}

      {!error && (
        <>
          {/* Tab selector: Global + Groups */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("global")}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                activeTab === "global"
                  ? "bg-green-700 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              🌐 Globalno
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeTab === g.id
                    ? "bg-green-700 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`flex-1 py-2 text-xs sm:text-sm rounded-md transition-colors ${
                  period === p.value
                    ? "bg-green-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* My rank badge */}
          {myRank > 0 && activeTab === "global" && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4 text-center">
              <span className="text-gray-400 text-sm">Tvoje mesto: </span>
              <span className="text-lg font-bold text-green-400">#{myRank}</span>
            </div>
          )}

          {/* Scoreboard list */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">Nalagam...</div>
          ) : (
            <div className="space-y-2">
              {scoreboard.map((entry, idx) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 rounded-lg p-3 ${
                    entry.userId === myUserId
                      ? "bg-green-900/30 border border-green-800"
                      : "bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                      idx === 0
                        ? "bg-yellow-500 text-black"
                        : idx === 1
                        ? "bg-gray-400 text-black"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {entry.username}
                      {entry.userId === myUserId && (
                        <span className="text-xs text-green-400 ml-1">(ti)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.gamesPlayed} iger · {entry.winRate}% · 🔥 {entry.streak}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{entry.totalScore}</div>
                    <div className="text-xs text-gray-500">točk</div>
                  </div>
                </div>
              ))}

              {scoreboard.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Ni podatkov za izbrano obdobje.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
