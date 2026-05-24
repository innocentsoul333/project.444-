// app/api/communities/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const slug = searchParams.get("slug");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const communities = await prisma.community.findMany({
      where: {
        ...(type ? { type: type as any } : {}),
        ...(slug ? { slug: { contains: slug, mode: "insensitive" } } : {}),
      },
      orderBy: [{ trendingScore: "desc" }, { memberCount: "desc" }],
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        geofences: true,
        members: {
          take: 3,
          include: {
            user: true,
          },
        },
        rankings: {
          take: 5,
          orderBy: { date: "desc" },
        },
      },
    });

    const nextCursor =
      communities.length === limit
        ? communities[communities.length - 1]?.id
        : null;

    return NextResponse.json({ communities, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch communities" },
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
      slug,
      name,
      type,
      description = null,
      imageUrl = null,
      isPrivate = false,
      isVerified = false,
      geofences = [],
    } = body ?? {};

    if (!slug || !name || !type) {
      return NextResponse.json(
        { error: "slug, name, and type are required" },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        slug,
        name,
        type,
        description,
        imageUrl,
        isPrivate: Boolean(isPrivate),
        isVerified: Boolean(isVerified),
        geofences: Array.isArray(geofences)
          ? {
              create: geofences.map((fence: any) => ({
                label: fence.label,
                lat: fence.lat,
                lng: fence.lng,
                radiusMeters: fence.radiusMeters,
                kind: fence.kind ?? "CUSTOM",
                isActive: fence.isActive ?? true,
                privacyMode: fence.privacyMode ?? "HASHED",
              })),
            }
          : undefined,
      },
      include: {
        geofences: true,
        members: true,
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create community" },
      { status: 500 }
    );
  }
}
