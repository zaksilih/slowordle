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
    const period = url.searchParams.get("period") || "alltime";

    const { startDate, endDate } = getDateRange(period);

    const attempts = await prisma.gameAttempt.findMany({
      where: {
        userId: session.user.id,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ["won", "lost"] },
      },
      include: {
        puzzle: { select: { date: true, puzzleNumber: true, wordLength: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    const gamesPlayed = attempts.length;
    const gamesWon = attempts.filter((a) => a.status === "won").length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

    // Guess distribution (1-6)
    const distribution = [0, 0, 0, 0, 0, 0];
    for (const a of attempts) {
      if (a.status === "won") {
        const guessCount = (a.guesses as unknown[]).length;
        if (guessCount >= 1 && guessCount <= 6) {
          distribution[guessCount - 1]++;
        }
      }
    }

    // Recent games
    const recentGames = attempts.slice(0, 10).map((a) => ({
      puzzleNumber: a.puzzle.puzzleNumber,
      date: a.puzzle.date,
      wordLength: a.puzzle.wordLength,
      status: a.status,
      score: a.score,
      guessCount: (a.guesses as unknown[]).length,
    }));

    // Get user streaks
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { streak: true, maxStreak: true },
    });

    return NextResponse.json({
      gamesPlayed,
      gamesWon,
      totalScore,
      winRate,
      distribution,
      recentGames,
      streak: user?.streak || 0,
      maxStreak: user?.maxStreak || 0,
      period,
    });
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
