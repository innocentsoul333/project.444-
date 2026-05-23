// app/api/matches/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { targetUserId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        initiator: true,
        target: true,
      },
    });

    const nextCursor = matches.length === limit ? matches[matches.length - 1]?.id : null;

    return NextResponse.json({ matches, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
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
      initiatorUserId,
      targetUserId,
      initiatorAnonHash = null,
      targetAnonHash = null,
    } = body ?? {};

    if (!initiatorUserId || !targetUserId) {
      return NextResponse.json(
        { error: "initiatorUserId and targetUserId are required" },
        { status: 400 }
      );
    }

    if (initiatorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create a match on behalf of another user" },
        { status: 403 }
      );
    }

    if (initiatorUserId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot match with yourself" },
        { status: 400 }
      );
    }

    const existing = await prisma.match.findUnique({
      where: {
        initiatorUserId_targetUserId: {
          initiatorUserId,
          targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ match: existing }, { status: 200 });
    }

    const reciprocal = await prisma.match.findUnique({
      where: {
        initiatorUserId_targetUserId: {
          initiatorUserId: targetUserId,
          targetUserId: initiatorUserId,
        },
      },
    });

    const shouldReveal = reciprocal?.status === "PENDING" || reciprocal?.status === "MUTUAL";

    const match = await prisma.match.create({
      data: {
        initiatorUserId,
        targetUserId,
        initiatorAnonHash,
        targetAnonHash,
        status: shouldReveal ? "MUTUAL" : "PENDING",
        revealedAt: shouldReveal ? new Date() : null,
      },
      include: {
        initiator: true,
        target: true,
      },
    });

    if (shouldReveal && reciprocal && reciprocal.status !== "REVEALED") {
      await prisma.match.update({
        where: { id: reciprocal.id },
        data: {
          status: "REVEALED",
          revealedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ match }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
