import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Invite a user to the group by username or email
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string" || identifier.trim().length < 2) {
      return NextResponse.json(
        { error: "Vnesite uporabniško ime ali email" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim().toLowerCase();

    // Verify the inviter is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: session.user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Niste član te skupine" }, { status: 403 });
    }

    // Find the target user by username or email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmed, mode: "insensitive" } },
          { email: { equals: trimmed, mode: "insensitive" } },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Uporabnik ni bil najden" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: targetUser.id },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Uporabnik je že član skupine" },
        { status: 409 }
      );
    }

    // Check group member limit
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Skupina ne obstaja" }, { status: 404 });
    }

    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Skupina je polna" },
        { status: 400 }
      );
    }

    // Add member
    await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
        role: "member",
      },
    });

    return NextResponse.json({
      success: true,
      username: targetUser.username || targetUser.email,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
