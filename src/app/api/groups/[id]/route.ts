import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update group (rename). Only owner can do this.
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json(
        { error: "Ime skupine mora imeti 2-50 znakov" },
        { status: 400 }
      );
    }

    // Verify ownership
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Skupina ne obstaja" }, { status: 404 });
    }
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Samo lastnik lahko spremeni ime" }, { status: 403 });
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ id: updated.id, name: updated.name });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a member from group. Only owner can do this.
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Verify ownership
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Skupina ne obstaja" }, { status: 404 });
    }
    if (group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Samo lastnik lahko odstrani člane" }, { status: 403 });
    }

    // Cannot remove yourself (owner)
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Lastnik se ne more odstraniti" }, { status: 400 });
    }

    // Remove member
    await prisma.groupMember.delete({
      where: {
        groupId_userId: { groupId: id, userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
