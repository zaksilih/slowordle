import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDailyWord, evaluateGuess, calculateScore } from "@/lib/game-logic";
import { isValidWord } from "@/data";

const GAME_SALT = process.env.GAME_SALT || "slovvordle-default-salt-2024";
const MAX_GUESSES = 6;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { guess } = await request.json();
    if (!guess || typeof guess !== "string") {
      return NextResponse.json(
        { error: "Invalid guess" },
        { status: 400 }
      );
    }

    const normalizedGuess = guess.toLowerCase().trim();

    // Get today's puzzle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { word, wordLength, puzzleNumber } = getDailyWord(today, GAME_SALT);

    // Validate guess length matches today's word length
    if (normalizedGuess.length !== wordLength) {
      return NextResponse.json(
        { error: `Beseda mora imeti ${wordLength} črk` },
        { status: 400 }
      );
    }

    // Validate guess is a real word
    if (!isValidWord(normalizedGuess)) {
      return NextResponse.json(
        { error: "Beseda ni v slovarju" },
        { status: 400 }
      );
    }

    // Ensure puzzle record exists
    const puzzle = await prisma.dailyPuzzle.upsert({
      where: { date: today },
      update: {},
      create: {
        date: today,
        wordLength,
        word,
        puzzleNumber,
      },
    });

    // Get or create game attempt
    let attempt = await prisma.gameAttempt.findUnique({
      where: {
        userId_puzzleId: {
          userId: session.user.id,
          puzzleId: puzzle.id,
        },
      },
    });

    if (attempt && attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "Današnja uganka je že končana" },
        { status: 400 }
      );
    }

    const currentGuesses = (attempt?.guesses as Array<{ word: string; result: string[] }>) || [];

    if (currentGuesses.length >= MAX_GUESSES) {
      return NextResponse.json(
        { error: "Porabili ste vse poskuse" },
        { status: 400 }
      );
    }

    // Evaluate the guess
    const result = evaluateGuess(normalizedGuess, word);
    const newGuess = { word: normalizedGuess, result: result.letters };
    const updatedGuesses = [...currentGuesses, newGuess];

    // Determine game status
    const isCorrect = result.letters.every((l) => l === "correct");
    const isLastGuess = updatedGuesses.length >= MAX_GUESSES;
    let status = "in_progress";
    let score = 0;

    if (isCorrect) {
      status = "won";
      score = calculateScore(updatedGuesses.length, true);
    } else if (isLastGuess) {
      status = "lost";
      score = 0;
    }

    // Update or create attempt
    if (attempt) {
      attempt = await prisma.gameAttempt.update({
        where: { id: attempt.id },
        data: {
          guesses: updatedGuesses,
          status,
          score,
          ...(status !== "in_progress" ? { completedAt: new Date() } : {}),
        },
      });
    } else {
      attempt = await prisma.gameAttempt.create({
        data: {
          userId: session.user.id,
          puzzleId: puzzle.id,
          guesses: updatedGuesses,
          status,
          score,
          ...(status !== "in_progress" ? { completedAt: new Date() } : {}),
        },
      });
    }

    // Update streak if game just completed
    if (status === "won") {
      await updateStreak(session.user.id);
    } else if (status === "lost") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { streak: 0 },
      });
    }

    return NextResponse.json({
      result: result.letters,
      guesses: updatedGuesses,
      status,
      score,
      // Reveal word only when game is over
      ...(status !== "in_progress" ? { word } : {}),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const newStreak = user.streak + 1;
  const newMaxStreak = Math.max(newStreak, user.maxStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      maxStreak: newMaxStreak,
    },
  });
}
