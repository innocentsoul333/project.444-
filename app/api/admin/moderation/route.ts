// app/api/admin/moderation/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildLegacyBackfillPatch } from "@/lib/report-targets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    let items = await prisma.report.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { targetType: type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
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

    const stale = items
      .map((item) => ({ id: item.id, patch: buildLegacyBackfillPatch(item) }))
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

      items = await prisma.report.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(type ? { targetType: type } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
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

    const nextCursor = items.length === limit ? items[items.length - 1]?.id : null;

    return NextResponse.json({ reports: items, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to load moderation queue" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, status = "RESOLVED", notes = null } = body ?? {};

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        notes,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "Failed to update moderation item" },
      { status: 500 }
    );
  }
}
