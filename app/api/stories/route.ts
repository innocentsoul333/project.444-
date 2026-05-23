// app/api/stories/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateText, moderateImage } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...(communityId ? { communityId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
      },
    });

    const nextCursor =
      stories.length === limit ? stories[stories.length - 1]?.id : null;

    return NextResponse.json({ stories, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stories" },
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
      authorUserId,
      anonymousIdentityId = null,
      communityId,
      mediaUrl,
      thumbnailUrl = null,
      caption = null,
      isAnonymous = false,
      expiresAt = null,
      mediaType = "image",
    } = body ?? {};

    if (!authorUserId || !communityId || !mediaUrl) {
      return NextResponse.json(
        { error: "authorUserId, communityId, and mediaUrl are required" },
        { status: 400 }
      );
    }

    if (authorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create a story for another user" },
        { status: 403 }
      );
    }

    const moderationInput = [caption, mediaUrl].filter(Boolean).join("\n").trim();

    const moderation =
      mediaType === "image"
        ? await moderateImage(mediaUrl)
        : moderationInput
        ? await moderateText(moderationInput)
        : {
            approved: true,
            flagged: false,
            categories: {},
            categoryScores: {},
            raw: null,
          };

    const story = await prisma.story.create({
      data: {
        authorUserId,
        anonymousIdentityId,
        communityId,
        mediaUrl,
        thumbnailUrl,
        caption,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        moderationStatus: moderation.approved ? "APPROVED" : "FLAGGED",
      },
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
      },
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
