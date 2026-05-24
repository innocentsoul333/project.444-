// app/api/feeds/nearby/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { distanceMeters } from "@/lib/geofence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radiusMeters = Number(searchParams.get("radiusMeters") ?? 500);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng are required numbers" },
        { status: 400 }
      );
    }

    const communities = await prisma.community.findMany({
      include: {
        geofences: {
          where: { isActive: true },
        },
      },
    });

    const nearbyCommunities = communities.filter((community) =>
      community.geofences.some((fence) => {
        const d = distanceMeters(
          { lat, lng },
          { lat: fence.lat, lng: fence.lng }
        );
        return d <= Math.max(fence.radiusMeters, radiusMeters);
      })
    );

    const communityIds = nearbyCommunities.map((community) => community.id);

    const posts = await prisma.post.findMany({
      where: {
        moderationStatus: "APPROVED",
        ...(communityIds.length ? { communityId: { in: communityIds } } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        comments: {
          take: 2,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const rankedPosts = posts
      .map((post) => {
        const dist = nearbyCommunities.length
          ? Math.min(
              ...nearbyCommunities
                .filter((c) => c.id === post.communityId)
                .flatMap((c) =>
                  c.geofences.map((f) =>
                    distanceMeters({ lat, lng }, { lat: f.lat, lng: f.lng })
                  )
                )
            )
          : Number.POSITIVE_INFINITY;

        const score =
          post.upvotes * 3 +
          post.commentCount * 2 +
          (post.isPinned ? 10 : 0) +
          Math.max(0, 1000 - Math.floor(dist / 10));

        return { ...post, proximityScore: score, distanceMeters: dist };
      })
      .sort((a, b) => b.proximityScore - a.proximityScore);

    return NextResponse.json({
      communities: nearbyCommunities,
      posts: rankedPosts,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load nearby feed" },
      { status: 500 }
    );
  }
}
