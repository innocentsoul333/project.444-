// app/api/feeds/for-you/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        memberships: {
          select: {
            communityId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const communityIds = user.memberships.map((m) => m.communityId);

    const recentInteractions = await prisma.vote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: true,
        comment: true,
        poll: true,
        placement: true,
      },
    });

    const interactedCommunityIds = Array.from(
      new Set(
        recentInteractions
          .flatMap((vote) => [
            vote.post?.communityId,
            vote.comment?.postId ? undefined : undefined,
            vote.poll?.communityId,
            vote.placement?.communityId,
          ])
          .filter(Boolean)
      )
    ) as string[];

    const preferredCommunityIds = Array.from(
      new Set([...communityIds, ...interactedCommunityIds])
    );

    const posts = await prisma.post.findMany({
      where: {
        moderationStatus: "APPROVED",
        ...(preferredCommunityIds.length
          ? { communityId: { in: preferredCommunityIds } }
          : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit * 2,
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        comments: {
          take: 2,
          orderBy: { createdAt: "desc" },
        },
        votes: true,
        trustSignals: true,
      },
    });

    const scored = posts
      .map((post) => {
        const signalScore =
          post.upvotes * 3 +
          post.commentCount * 2 +
          post.shareCount * 2 +
          post.repostCount * 2 +
          post.trustSignals.reduce((sum, s) => {
            if (s.action === "CONFIRM") return sum + s.weight;
            if (s.action === "DENY") return sum - s.weight;
            return sum;
          }, 0);

        const affinityScore = preferredCommunityIds.includes(post.communityId)
          ? 25
          : 0;

        const recencyScore = Math.max(
          0,
          100 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 3600000)
        );

        return {
          ...post,
          forYouScore: signalScore + affinityScore + recencyScore + (post.isPinned ? 10 : 0),
        };
      })
      .sort((a, b) => b.forYouScore - a.forYouScore)
      .slice(0, limit);

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json(
      { error: "Failed to load personalized feed" },
      { status: 500 }
    );
  }
}
