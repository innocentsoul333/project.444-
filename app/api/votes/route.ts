// app/api/votes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoteTarget = "post" | "comment" | "poll" | "placement";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const commentId = searchParams.get("commentId");
    const pollId = searchParams.get("pollId");
    const placementId = searchParams.get("placementId");

    const votes = await prisma.vote.findMany({
      where: {
        ...(postId ? { postId } : {}),
        ...(commentId ? { commentId } : {}),
        ...(pollId ? { pollId } : {}),
        ...(placementId ? { placementId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        anonymousIdentity: true,
      },
    });

    return NextResponse.json({ votes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
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
      targetType,
      targetId,
      value,
      trustAction = null,
      anonymousIdentityId = null,
    } = body ?? {};

    if (!targetType || !targetId || typeof value !== "number") {
      return NextResponse.json(
        { error: "targetType, targetId, and value are required" },
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

    const data: {
      userId: string;
      anonymousIdentityId: string | null;
      postId?: string;
      commentId?: string;
      pollId?: string;
      pollOptionId?: string;
      placementId?: string;
      value: number;
      trustAction?: string | null;
    } = {
      userId: user.id,
      anonymousIdentityId,
      value,
      trustAction,
    };

    if (targetType === "post") data.postId = targetId;
    if (targetType === "comment") data.commentId = targetId;
    if (targetType === "poll") data.pollId = targetId;
    if (targetType === "placement") data.placementId = targetId;

    const existing = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        ...(data.postId ? { postId: data.postId } : {}),
        ...(data.commentId ? { commentId: data.commentId } : {}),
        ...(data.pollId ? { pollId: data.pollId } : {}),
        ...(data.placementId ? { placementId: data.placementId } : {}),
      },
    });

    const vote = existing
      ? await prisma.vote.update({
          where: { id: existing.id },
          data: {
            value,
            trustAction,
            anonymousIdentityId,
          },
        })
      : await prisma.vote.create({
          data,
        });

    if (data.postId) {
      await prisma.post.update({
        where: { id: data.postId },
        data: value > 0 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
      });
    }

    if (data.commentId) {
      await prisma.comment.update({
        where: { id: data.commentId },
        data: value > 0 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
      });
    }

    if (data.pollId && body.pollOptionId) {
      await prisma.pollOption.update({
        where: { id: body.pollOptionId },
        data: { voteCount: { increment: 1 } },
      });

      await prisma.vote.update({
        where: { id: vote.id },
        data: { pollOptionId: body.pollOptionId },
      });
    }

    if (data.placementId) {
      await prisma.placement.update({
        where: { id: data.placementId },
        data: {
          authenticityScore: {
            increment: value > 0 ? 1 : -1,
          },
        },
      });
    }

    return NextResponse.json({ vote }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
  }
}
