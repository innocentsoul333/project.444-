// app/api/alerts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const severity = searchParams.get("severity");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const alerts = await prisma.alert.findMany({
      where: {
        ...(communityId ? { communityId } : {}),
        ...(severity ? { severity: severity as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        community: true,
        reporter: true,
        anonymousIdentity: true,
      },
    });

    const nextCursor = alerts.length === limit ? alerts[alerts.length - 1]?.id : null;

    return NextResponse.json({ alerts, nextCursor });
  } catch {
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
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
      reporterUserId,
      anonymousIdentityId = null,
      communityId,
      title,
      description,
      severity,
      locationLabel = null,
      lat = null,
      lng = null,
      isAnonymous = false,
    } = body ?? {};

    if (!reporterUserId || !communityId || !title || !description || !severity) {
      return NextResponse.json(
        {
          error:
            "reporterUserId, communityId, title, description, and severity are required",
        },
        { status: 400 }
      );
    }

    if (reporterUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create an alert for another user" },
        { status: 403 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        reporterUserId,
        anonymousIdentityId,
        communityId,
        title,
        description,
        severity,
        locationLabel,
        lat,
        lng,
        moderationStatus: "APPROVED",
        escalatedToAdmin: severity === "HIGH" || severity === "CRITICAL",
      },
      include: {
        community: true,
        reporter: true,
        anonymousIdentity: true,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
