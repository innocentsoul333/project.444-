// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateText } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const posts = await prisma.post.findMany({
      where: communityId ? { communityId } : {},
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            anonymousIdentity: true,
          },
        },
        votes: true,
        mediaAttachments: true,
      },
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id : null;

    return NextResponse.json({ posts, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
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
      parentPostId = null,
      type = "TEXT",
      visibility = "COMMUNITY",
      title = null,
      body: postBody = null,
      mediaUrl = null,
      mediaType = null,
      locationLabel = null,
      isAnonymous = false,
      expiresAt = null,
    } = body ?? {};

    if (!authorUserId || !communityId) {
      return NextResponse.json(
        { error: "authorUserId and communityId are required" },
        { status: 400 }
      );
    }

    if (authorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create a post for another user" },
        { status: 403 }
      );
    }

    const moderationText = [title, postBody, locationLabel]
      .filter(Boolean)
      .join("\n")
      .trim();

    const moderation = moderationText
      ? await moderateText(moderationText)
      : {
          approved: true,
          flagged: false,
          categories: {},
          categoryScores: {},
          raw: null,
        };

    const post = await prisma.post.create({
      data: {
        authorUserId,
        anonymousIdentityId,
        communityId,
        parentPostId,
        type,
        visibility,
        title,
        body: postBody,
        mediaUrl,
        mediaType,
        locationLabel,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        moderationStatus: moderation.approved ? "APPROVED" : "FLAGGED",
        ...(moderation.raw
          ? {
              moderationLogs: {
                create: {
                  model: "omni-moderation-latest",
                  score: moderation.flagged ? 1 : 0,
                  verdict: moderation.approved ? "APPROVED" : "FLAGGED",
                  reason: moderation.flagged
                    ? JSON.stringify(moderation.categories)
                    : null,
                },
              },
            }
          : {}),
      },
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        comments: true,
        votes: true,
        mediaAttachments: true,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
