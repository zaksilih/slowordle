import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List user's groups
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            owner: { select: { username: true } },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      inviteCode: m.group.inviteCode,
      memberCount: m.group._count.members,
      owner: m.group.owner.username,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ groups, myUserId: session.user.id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new group
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "Ime skupine mora imeti 2-50 znakov" },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
