// app/api/presence/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const presence = await prisma.presence.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ presence });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch presence" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      status = "ONLINE",
      communityId = null,
      typingInThreadId = null,
    } = body ?? {};

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const presence = await prisma.presence.upsert({
      where: { userId: user.id },
      update: {
        status,
        communityId,
        typingInThreadId,
        lastPingAt: new Date(),
      },
      create: {
        userId: user.id,
        status,
        communityId,
        typingInThreadId,
        lastPingAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ presence }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.presence.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to clear presence" },
      { status: 500 }
    );
  }
}
