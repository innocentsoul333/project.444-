// app/api/location/join/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distanceMeters } from "@/lib/geofence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JoinRequestBody = {
  lat: number;
  lng: number;
  accuracy?: number;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JoinRequestBody;
    const { lat, lng, accuracy } = body;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return NextResponse.json(
        { error: "lat and lng are required numbers" },
        { status: 400 }
      );
    }

    const geofences = await prisma.geofence.findMany({
      where: { isActive: true },
      include: {
        community: true,
      },
    });

    const matched = geofences.filter((fence) => {
      const d = distanceMeters(
        { lat, lng },
        { lat: fence.lat, lng: fence.lng }
      );
      return d <= fence.radiusMeters;
    });

    const communities = matched.map((fence) => fence.community);
    const membershipIds = communities.map((c) => c.id);

    if (body.userId && membershipIds.length > 0) {
      await prisma.communityMember.createMany({
        data: membershipIds.map((communityId) => ({
          userId: body.userId!,
          communityId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      ok: true,
      accuracy: accuracy ?? null,
      communities,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to join nearby communities" },
      { status: 500 }
    );
  }
}
