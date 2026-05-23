// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateText } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const cursor = searchParams.get("cursor");

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        parentComment: true,
        childComments: {
          include: {
            author: true,
            anonymousIdentity: true,
          },
        },
        votes: true,
      },
    });

    const nextCursor =
      comments.length === limit ? comments[comments.length - 1]?.id : null;

    return NextResponse.json({ comments, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
      postId,
      authorUserId,
      anonymousIdentityId = null,
      parentCommentId = null,
      text,
      isAnonymous = false,
    } = body ?? {};

    if (!postId || !authorUserId || !text) {
      return NextResponse.json(
        { error: "postId, authorUserId, and text are required" },
        { status: 400 }
      );
    }

    if (authorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot comment as another user" },
        { status: 403 }
      );
    }

    const moderation = await moderateText(text);

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorUserId,
        anonymousIdentityId,
        parentCommentId,
        body: text,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        moderationStatus: moderation.approved ? "APPROVED" : "FLAGGED",
      },
      include: {
        author: true,
        anonymousIdentity: true,
        parentComment: true,
        childComments: true,
        votes: true,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    if (!moderation.approved) {
      await prisma.moderationLog.create({
        data: {
          postId,
          model: "omni-moderation-latest",
          score: moderation.flagged ? 1 : 0,
          verdict: "FLAGGED",
          reason: JSON.stringify(moderation.categories),
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
