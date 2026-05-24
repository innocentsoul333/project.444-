// app/api/device-sessions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessions = await prisma.deviceSession.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch device sessions" },
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
      deviceId,
      deviceName = null,
      platform = null,
      browser = null,
      ipAddress = null,
      userAgent = null,
    } = body ?? {};

    if (!deviceId) {
      return NextResponse.json(
        { error: "deviceId is required" },
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

    const session = await prisma.deviceSession.upsert({
      where: {
        userId_deviceId: {
          userId: user.id,
          deviceId,
        },
      },
      update: {
        deviceName,
        platform,
        browser,
        ipAddress,
        userAgent,
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        userId: user.id,
        deviceId,
        deviceName,
        platform,
        browser,
        ipAddress,
        userAgent,
        lastSeenAt: new Date(),
        isActive: true,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create device session" },
      { status: 500 }
    );
  }
}
