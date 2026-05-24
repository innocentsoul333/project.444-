// app/api/feeds/trending/route.ts
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
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: since },
        moderationStatus: "APPROVED",
        ...(communityId ? { communityId } : {}),
      },
      orderBy: [{ upvotes: "desc" }, { commentCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        comments: {
          take: 2,
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            anonymousIdentity: true,
          },
        },
        votes: true,
        trustSignals: true,
      },
    });

    const scored = posts
      .map((post) => {
        const trustBoost = post.trustSignals.reduce((sum, s) => {
          if (s.action === "CONFIRM") return sum + s.weight;
          if (s.action === "DENY") return sum - s.weight;
          return sum;
        }, 0);

        const score =
          post.upvotes * 3 +
          post.commentCount * 2 +
          post.shareCount * 2 +
          post.repostCount * 2 +
          trustBoost +
          (post.isPinned ? 10 : 0);

        return { ...post, trendingScore: score };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore);

    return NextResponse.json({ posts: scored });
  } catch {
    return NextResponse.json({ error: "Failed to load trending feed" }, { status: 500 });
  }
}
