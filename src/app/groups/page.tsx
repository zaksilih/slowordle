"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  owner: string;
  role: string;
}

interface ScoreEntry {
  userId: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  streak: number;
  winRate: number;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [period, setPeriod] = useState("daily");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [myUserId, setMyUserId] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchScoreboard(selectedGroup, period);
    }
  }, [selectedGroup, period]);

  async function fetchGroups() {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups);
      if (data.myUserId) setMyUserId(data.myUserId);
      if (data.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(data.groups[0].id);
      }
    }
  }

  async function fetchScoreboard(groupId: string, p: string) {
    const res = await fetch(`/api/groups/${groupId}/scoreboard?period=${p}`);
    if (res.ok) {
      const data = await res.json();
      setScoreboard(data.scoreboard);
    }
  }

  async function createGroup() {
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowCreate(false);
      setNewGroupName("");
      fetchGroups();
    } else {
      setError(data.error);
    }
  }

  async function joinGroup() {
    setError("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowJoin(false);
      setJoinCode("");
      fetchGroups();
    } else {
      setError(data.error);
    }
  }

  async function renameGroup() {
    if (!selectedGroup || !renameValue.trim()) return;
    setError("");
    const res = await fetch(`/api/groups/${selectedGroup}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowRename(false);
      setRenameValue("");
      fetchGroups();
    } else {
      setError(data.error);
    }
  }

  async function removeMember(userId: string, username: string) {
    if (!selectedGroup) return;
    if (!confirm(`Ali res želite odstraniti ${username} iz skupine?`)) return;

    const res = await fetch(`/api/groups/${selectedGroup}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      fetchScoreboard(selectedGroup, period);
    }
  }

  const currentGroup = groups.find((g) => g.id === selectedGroup);
  const isOwner = currentGroup?.role === "owner";

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-gray-400 hover:text-white">
          ← Nazaj
        </Link>
        <h1 className="text-xl font-bold">Skupine</h1>
        <div className="w-16"></div>
      </div>

      {/* Group selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              selectedGroup === g.id
                ? "bg-green-700 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {g.name}
          </button>
        ))}
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-full text-sm bg-gray-800 text-green-400 hover:bg-gray-700 whitespace-nowrap"
        >
          + Nova
        </button>
        <button
          onClick={() => setShowJoin(true)}
          className="px-3 py-1.5 rounded-full text-sm bg-gray-800 text-blue-400 hover:bg-gray-700 whitespace-nowrap"
        >
          Pridruži se
        </button>
      </div>

      {/* Invite code + group management */}
      {currentGroup && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">Koda za povabilo:</span>
              <span className="ml-2 font-mono text-sm">{currentGroup.inviteCode}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(currentGroup.inviteCode)}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            >
              Kopiraj
            </button>
          </div>
          {isOwner && (
            <button
              onClick={() => { setRenameValue(currentGroup.name); setShowRename(true); }}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✏️ Preimenuj skupino
            </button>
          )}
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
        {[
          { value: "daily", label: "Danes" },
          { value: "weekly", label: "Teden" },
          { value: "monthly", label: "Mesec" },
          { value: "yearly", label: "Leto" },
          { value: "alltime", label: "Skupaj" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-2 text-sm rounded-md ${
              period === p.value
                ? "bg-green-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="space-y-2">
        {scoreboard.map((entry, idx) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 bg-gray-800 rounded-lg p-3"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
              idx === 0 ? "bg-yellow-500 text-black" :
              idx === 1 ? "bg-gray-400 text-black" :
              idx === 2 ? "bg-amber-700 text-white" :
              "bg-gray-700 text-gray-300"
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium">{entry.username}</div>
              <div className="text-xs text-gray-400">
                {entry.gamesPlayed} iger · {entry.winRate}% zmag · 🔥 {entry.streak}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">{entry.totalScore}</div>
              <div className="text-xs text-gray-500">točk</div>
            </div>
            {isOwner && entry.userId !== myUserId && (
              <button
                onClick={() => removeMember(entry.userId, entry.username)}
                className="text-gray-500 hover:text-red-400 ml-1"
                title="Odstrani iz skupine"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {scoreboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {groups.length === 0
              ? "Ustvari ali se pridruži skupini za tekmovanje!"
              : "Ni podatkov za izbrano obdobje"}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Nova skupina</h2>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ime skupine"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Prekliči
              </button>
              <button
                onClick={createGroup}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold"
              >
                Ustvari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Pridruži se skupini</h2>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Koda povabila"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoin(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Prekliči
              </button>
              <button
                onClick={joinGroup}
                className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-bold"
              >
                Pridruži se
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Group Modal */}
      {showRename && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Preimenuj skupino</h2>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && renameGroup()}
              placeholder="Novo ime skupine"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRename(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Prekliči
              </button>
              <button
                onClick={renameGroup}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-bold"
              >
                Shrani
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
