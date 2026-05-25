import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDailyWord } from "@/lib/game-logic";

const GAME_SALT = process.env.GAME_SALT || "slovvordle-default-salt-2024";

export async function GET() {
  try {
    const session = await auth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { wordLength, puzzleNumber } = getDailyWord(today, GAME_SALT);

    // Ensure DailyPuzzle record exists
    let puzzle = await prisma.dailyPuzzle.findUnique({
      where: { date: today },
    });

    if (!puzzle) {
      const { word } = getDailyWord(today, GAME_SALT);
      puzzle = await prisma.dailyPuzzle.upsert({
        where: { date: today },
        update: {},
        create: {
          date: today,
          wordLength,
          word,
          puzzleNumber,
        },
      });
    }

    // If user is authenticated, fetch their game state
    let gameState = null;
    if (session?.user?.id) {
      const attempt = await prisma.gameAttempt.findUnique({
        where: {
          userId_puzzleId: {
            userId: session.user.id,
            puzzleId: puzzle.id,
          },
        },
      });

      if (attempt) {
        gameState = {
          guesses: attempt.guesses,
          status: attempt.status,
          score: attempt.score,
        };
      }
    }

    return NextResponse.json({
      puzzleNumber,
      wordLength,
      gameState,
      username: session?.user?.name || null,
      // Only reveal the word if game is over
      ...(gameState?.status === "won" || gameState?.status === "lost"
        ? { word: puzzle.word }
        : {}),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
