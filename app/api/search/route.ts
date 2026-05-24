// app/api/search/route.ts
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
    const q = (searchParams.get("q") ?? "").trim();
    const communityId = searchParams.get("communityId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 20);

    if (!q) {
      return NextResponse.json({ error: "q is required" }, { status: 400 });
    }

    const [posts, comments, communities, placements, polls] = await Promise.all([
      prisma.post.findMany({
        where: {
          ...(communityId ? { communityId } : {}),
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { locationLabel: { contains: q, mode: "insensitive" } },
          ],
          moderationStatus: "APPROVED",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          anonymousIdentity: true,
          community: true,
        },
      }),
      prisma.comment.findMany({
        where: {
          ...(communityId
            ? {
                post: { communityId },
              }
            : {}),
          body: { contains: q, mode: "insensitive" },
          moderationStatus: "APPROVED",
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          anonymousIdentity: true,
          post: {
            include: {
              community: true,
            },
          },
        },
      }),
      prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: [{ trendingScore: "desc" }, { memberCount: "desc" }],
        include: {
          geofences: true,
        },
      }),
      prisma.placement.findMany({
        where: {
          ...(communityId ? { communityId } : {}),
          OR: [
            { company: { contains: q, mode: "insensitive" } },
            { role: { contains: q, mode: "insensitive" } },
            { college: { contains: q, mode: "insensitive" } },
            { oaQuestions: { contains: q, mode: "insensitive" } },
            { interviewRound: { contains: q, mode: "insensitive" } },
            { hrQuestions: { contains: q, mode: "insensitive" } },
            { salaryBreakdown: { contains: q, mode: "insensitive" } },
            { rejectionReason: { contains: q, mode: "insensitive" } },
            { resumeTips: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: [{ authenticityScore: "desc" }, { createdAt: "desc" }],
        include: {
          author: true,
          anonymousIdentity: true,
          community: true,
        },
      }),
      prisma.poll.findMany({
        where: {
          ...(communityId ? { communityId } : {}),
          question: { contains: q, mode: "insensitive" },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
          anonymousIdentity: true,
          community: true,
          options: true,
        },
      }),
    ]);

    return NextResponse.json({
      posts,
      comments,
      communities,
      placements,
      polls,
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
