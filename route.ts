// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateText } from "@/lib/moderation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const posts = await prisma.post.findMany({
      where: {
        ...(communityId ? { communityId } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            anonymousIdentity: true,
          },
        },
        community: true,
        votes: true,
        mediaAttachments: true,
        moderationLogs: true,
      },
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id : null;

    return NextResponse.json({
      posts,
      nextCursor,
    });
  } catch (error) {
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
      anonymousIdentityId,
      communityId,
      parentPostId,
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

    const textToModerate =
      `${title ?? ""}\n${postBody ?? ""}\n${locationLabel ?? ""}`.trim();

    const moderation = textToModerate
      ? await moderateText(textToModerate)
      : { approved: true, raw: null };

    const moderationStatus = moderation.approved ? "APPROVED" : "FLAGGED";

    const post = await prisma.post.create({
      data: {
        authorUserId,
        anonymousIdentityId: anonymousIdentityId ?? null,
        communityId,
        parentPostId: parentPostId ?? null,
        type,
        visibility,
        title,
        body: postBody,
        mediaUrl,
        mediaType,
        locationLabel,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        moderationStatus,
        ...(moderation.raw
          ? {
              moderationLogs: {
                create: {
                  model: "omni-moderation-latest",
                  score: 0,
                  verdict: moderation.approved ? "APPROVED" : "FLAGGED",
                  reason: moderation.approved ? null : JSON.stringify(moderation.raw),
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
