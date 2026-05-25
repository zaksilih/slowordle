import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Join a group via invite code
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await request.json();
    if (!inviteCode) {
      return NextResponse.json(
        { error: "Koda povabila je obvezna" },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Skupina s to kodo ne obstaja" },
        { status: 404 }
      );
    }

    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Skupina je polna" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Že ste član te skupine" },
        { status: 400 }
      );
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "member",
      },
    });

    return NextResponse.json({
      id: group.id,
      name: group.name,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
