import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get group scoreboard
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "daily";

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: id, userId: session.user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Niste član te skupine" }, { status: 403 });
    }

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        user: {
          select: { id: true, username: true, image: true, streak: true, maxStreak: true },
        },
      },
    });

    // Get date range based on period
    const { startDate, endDate } = getDateRange(period);

    // Get all game attempts for members in the date range
    const memberIds = members.map((m: typeof members[number]) => m.user.id);
    const attempts = await prisma.gameAttempt.findMany({
      where: {
        userId: { in: memberIds },
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["won", "lost"] },
      },
      include: {
        puzzle: { select: { date: true, puzzleNumber: true, wordLength: true } },
      },
    });

    // Build scoreboard
    const scoreboard = members.map((m: typeof members[number]) => {
      const userAttempts = attempts.filter((a: typeof attempts[number]) => a.userId === m.user.id);
      const totalScore = userAttempts.reduce((sum: number, a: typeof attempts[number]) => sum + a.score, 0);
      const gamesPlayed = userAttempts.length;
      const gamesWon = userAttempts.filter((a: typeof attempts[number]) => a.status === "won").length;

      return {
        userId: m.user.id,
        username: m.user.username || "Anonimen",
        image: m.user.image,
        totalScore,
        gamesPlayed,
        gamesWon,
        streak: m.user.streak,
        maxStreak: m.user.maxStreak,
        winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
      };
    });

    // Sort by total score descending
    scoreboard.sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore);

    return NextResponse.json({ scoreboard, period });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;

  switch (period) {
    case "daily": {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "weekly": {
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
      startDate.setDate(startDate.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "monthly": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "yearly": {
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case "alltime":
    default: {
      startDate = new Date("2024-01-01");
    }
  }

  return { startDate, endDate };
}
