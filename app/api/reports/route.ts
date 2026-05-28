// app/api/reports/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildLegacyBackfillPatch, buildReportTargetPatch } from "@/lib/report-targets";

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

    let reports = await prisma.report.findMany({
      where: { reporterId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: true,
        reviewedBy: true,
        targetUser: true,
        post: true,
        comment: true,
        alert: true,
        poll: true,
        placement: true,
        community: true,
      },
    });

    const stale = reports
      .map((report) => ({ id: report.id, patch: buildLegacyBackfillPatch(report) }))
      .filter((item) => Boolean(item.patch));

    if (stale.length > 0) {
      await Promise.all(
        stale.map((item) =>
          prisma.report.update({
            where: { id: item.id },
            data: item.patch!,
          })
        )
      );

      reports = await prisma.report.findMany({
        where: { reporterId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          reporter: true,
          reviewedBy: true,
          targetUser: true,
          post: true,
          comment: true,
          alert: true,
          poll: true,
          placement: true,
          community: true,
        },
      });
    }

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
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
    const { targetType, targetId, reason, details = null } = body ?? {};

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "targetType, targetId, and reason are required" },
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

    const targetConnectData = buildReportTargetPatch(targetType, targetId);
    if (!targetConnectData) {
      return NextResponse.json(
        { error: "Invalid targetType. Use user, post, comment, alert, poll, placement, or community." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        ...targetConnectData,
        reason,
        details,
        status: "OPEN",
      },
      include: {
        reporter: true,
        reviewedBy: true,
        targetUser: true,
        post: true,
        comment: true,
        alert: true,
        poll: true,
        placement: true,
        community: true,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
