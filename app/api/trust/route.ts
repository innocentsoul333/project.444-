// app/api/trust/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const userId = searchParams.get("userId");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const signals = await prisma.trustSignal.findMany({
      where: {
        postId,
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        post: true,
        user: true,
      },
    });

    return NextResponse.json({ signals });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch trust signals" },
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
    const { postId, action, weight = 1 } = body ?? {};

    if (!postId || !action) {
      return NextResponse.json(
        { error: "postId and action are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const signal = await prisma.trustSignal.create({
      data: {
        postId,
        userId: user.id,
        action,
        weight: Number(weight) || 1,
      },
      include: {
        post: true,
        user: true,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: {
        trustScore: {
          increment: action === "CONFIRM" ? weight : action === "DENY" ? -weight : 0,
        },
      },
    });

    return NextResponse.json({ signal }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to record trust signal" },
      { status: 500 }
    );
  }
}
