"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StatsData {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  winRate: number;
  distribution: number[];
  recentGames: RecentGame[];
  streak: number;
  maxStreak: number;
  period: string;
}

interface RecentGame {
  puzzleNumber: number;
  date: string;
  wordLength: number;
  status: string;
  score: number;
  guessCount: number;
}

const PERIODS = [
  { value: "daily", label: "Danes" },
  { value: "weekly", label: "Teden" },
  { value: "monthly", label: "Mesec" },
  { value: "yearly", label: "Leto" },
  { value: "alltime", label: "Skupaj" },
];

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState("alltime");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  async function fetchStats(p: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?period=${p}`);
      if (res.status === 401) {
        setError("Za ogled statistike se morate prijaviti.");
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setError("");
      }
    } catch {
      setError("Napaka pri nalaganju statistike.");
    } finally {
      setLoading(false);
    }
  }

  const maxDistribution = stats ? Math.max(...stats.distribution, 1) : 1;

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-gray-400 hover:text-white">
          ← Nazaj
        </Link>
        <h1 className="text-xl font-bold">Statistika</h1>
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
          {/* Period selector */}
          <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1">
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

          {loading ? (
            <div className="text-center py-8 text-gray-400">Nalagam...</div>
          ) : stats ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard label="Točke" value={stats.totalScore} highlight />
                <StatCard label="Igre" value={stats.gamesPlayed} />
                <StatCard label="Zmage" value={`${stats.winRate}%`} />
                <StatCard label="Niz zmag" value={`🔥 ${stats.streak}`} />
              </div>

              {/* Guess distribution */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-3">
                  Porazdelitev poskusov
                </h2>
                <div className="space-y-1.5">
                  {stats.distribution.map((count, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-3">{i + 1}</span>
                      <div className="flex-1 h-5 bg-gray-700 rounded overflow-hidden">
                        <div
                          className={`h-full rounded flex items-center justify-end px-1.5 text-xs font-bold ${
                            count > 0 ? "bg-green-700" : ""
                          }`}
                          style={{
                            width: `${Math.max((count / maxDistribution) * 100, count > 0 ? 12 : 0)}%`,
                          }}
                        >
                          {count > 0 && count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent games */}
              {stats.recentGames.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-300 mb-3">
                    Zadnje igre
                  </h2>
                  <div className="space-y-2">
                    {stats.recentGames.map((game) => (
                      <div
                        key={game.puzzleNumber}
                        className="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            #{game.puzzleNumber}
                          </span>
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                            {game.wordLength} črk
                          </span>
                          <span className={`text-xs ${game.status === "won" ? "text-green-400" : "text-red-400"}`}>
                            {game.status === "won" ? `${game.guessCount}/6` : "✗"}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          +{game.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.gamesPlayed === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Ni podatkov za izbrano obdobje.
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${highlight ? "text-green-400" : "text-white"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
