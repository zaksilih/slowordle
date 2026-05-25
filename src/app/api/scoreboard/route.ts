import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "daily";

    const { startDate, endDate } = getDateRange(period);

    // Get all users who have completed at least one game in the period
    const attempts = await prisma.gameAttempt.findMany({
      where: {
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["won", "lost"] },
      },
      include: {
        user: { select: { id: true, username: true, streak: true } },
      },
    });

    // Aggregate by user
    const userMap = new Map<string, {
      userId: string;
      username: string;
      totalScore: number;
      gamesPlayed: number;
      gamesWon: number;
      streak: number;
    }>();

    for (const attempt of attempts) {
      const existing = userMap.get(attempt.userId);
      if (existing) {
        existing.totalScore += attempt.score;
        existing.gamesPlayed += 1;
        if (attempt.status === "won") existing.gamesWon += 1;
      } else {
        userMap.set(attempt.userId, {
          userId: attempt.user.id,
          username: attempt.user.username || "Anonimen",
          totalScore: attempt.score,
          gamesPlayed: 1,
          gamesWon: attempt.status === "won" ? 1 : 0,
          streak: attempt.user.streak,
        });
      }
    }

    const scoreboard = Array.from(userMap.values())
      .map((entry) => ({
        ...entry,
        winRate: entry.gamesPlayed > 0 ? Math.round((entry.gamesWon / entry.gamesPlayed) * 100) : 0,
      }))
      .sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore);

    // Find current user's rank
    const myRank = scoreboard.findIndex((e: { userId: string }) => e.userId === session.user!.id) + 1;

    return NextResponse.json({ scoreboard, period, myRank });
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
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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
