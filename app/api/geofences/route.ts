// app/api/geofences/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const isActive = searchParams.get("isActive");
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
    const cursor = searchParams.get("cursor");

    const geofences = await prisma.geofence.findMany({
      where: {
        ...(communityId ? { communityId } : {}),
        ...(isActive === "true"
          ? { isActive: true }
          : isActive === "false"
          ? { isActive: false }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        community: true,
      },
    });

    const nextCursor =
      geofences.length === limit ? geofences[geofences.length - 1]?.id : null;

    return NextResponse.json({ geofences, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch geofences" },
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
      communityId,
      label,
      lat,
      lng,
      radiusMeters,
      kind = "CUSTOM",
      isActive = true,
      privacyMode = "HASHED",
    } = body ?? {};

    if (
      !communityId ||
      !label ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof radiusMeters !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "communityId, label, lat, lng, and radiusMeters are required",
        },
        { status: 400 }
      );
    }

    const geofence = await prisma.geofence.create({
      data: {
        communityId,
        label,
        lat,
        lng,
        radiusMeters,
        kind,
        isActive: Boolean(isActive),
        privacyMode,
      },
      include: {
        community: true,
      },
    });

    return NextResponse.json({ geofence }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create geofence" },
      { status: 500 }
    );
  }
}
