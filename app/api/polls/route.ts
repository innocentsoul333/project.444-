// app/api/polls/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const polls = await prisma.poll.findMany({
      where: communityId ? { communityId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        options: true,
        votes: true,
      },
    });

    const nextCursor = polls.length === limit ? polls[polls.length - 1]?.id : null;

    return NextResponse.json({ polls, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
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
      authorUserId,
      anonymousIdentityId = null,
      communityId,
      question,
      options = [],
      isAnonymous = false,
      closesAt = null,
    } = body ?? {};

    if (!authorUserId || !communityId || !question) {
      return NextResponse.json(
        { error: "authorUserId, communityId, and question are required" },
        { status: 400 }
      );
    }

    if (authorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create a poll for another user" },
        { status: 403 }
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "At least two options are required" },
        { status: 400 }
      );
    }

    const poll = await prisma.poll.create({
      data: {
        authorUserId,
        anonymousIdentityId,
        communityId,
        question,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        closesAt: closesAt ? new Date(closesAt) : null,
        options: {
          create: options.map((text: string) => ({
            text,
          })),
        },
      },
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        options: true,
        votes: true,
      },
    });

    return NextResponse.json({ poll }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
