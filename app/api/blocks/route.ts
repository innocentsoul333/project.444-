// app/api/blocks/route.ts
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

    const blocks = await prisma.block.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ blocks });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch blocks" },
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
    const { blockedUserId } = body ?? {};

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "blockedUserId is required" },
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

    if (user.id === blockedUserId) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    const block = await prisma.block.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: blockedUserId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        blockerId: user.id,
        blockedId: blockedUserId,
        isActive: true,
      },
      include: {
        blocked: true,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create block" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockedUserId = searchParams.get("blockedUserId");

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "blockedUserId is required" },
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

    const result = await prisma.block.updateMany({
      where: {
        blockerId: user.id,
        blockedId: blockedUserId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ ok: true, updated: result.count });
  } catch {
    return NextResponse.json(
      { error: "Failed to unblock user" },
      { status: 500 }
    );
  }
}
