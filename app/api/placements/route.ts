// app/api/placements/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const communityId = searchParams.get("communityId");
    const company = searchParams.get("company");
    const role = searchParams.get("role");
    const college = searchParams.get("college");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");

    const placements = await prisma.placement.findMany({
      where: {
        ...(communityId ? { communityId } : {}),
        ...(company ? { company: { contains: company, mode: "insensitive" } } : {}),
        ...(role ? { role: { contains: role, mode: "insensitive" } } : {}),
        ...(college ? { college: { contains: college, mode: "insensitive" } } : {}),
      },
      orderBy: [{ authenticityScore: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        votes: true,
      },
    });

    const nextCursor =
      placements.length === limit ? placements[placements.length - 1]?.id : null;

    return NextResponse.json({ placements, nextCursor });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch placements" },
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
      authorUserId,
      anonymousIdentityId = null,
      communityId,
      company,
      role,
      packageLpa = null,
      college = null,
      year = null,
      difficulty = null,
      oaQuestions = null,
      interviewRound = null,
      hrQuestions = null,
      salaryBreakdown = null,
      rejectionReason = null,
      resumeTips = null,
      isAnonymous = true,
    } = body ?? {};

    if (!authorUserId || !communityId || !company || !role) {
      return NextResponse.json(
        { error: "authorUserId, communityId, company, and role are required" },
        { status: 400 }
      );
    }

    if (authorUserId !== userId) {
      return NextResponse.json(
        { error: "Cannot create placement data for another user" },
        { status: 403 }
      );
    }

    const placement = await prisma.placement.create({
      data: {
        authorUserId,
        anonymousIdentityId,
        communityId,
        company,
        role,
        packageLpa,
        college,
        year,
        difficulty,
        oaQuestions,
        interviewRound,
        hrQuestions,
        salaryBreakdown,
        rejectionReason,
        resumeTips,
        isAnonymous: Boolean(isAnonymous || anonymousIdentityId),
        authenticityScore: 50,
      },
      include: {
        author: true,
        anonymousIdentity: true,
        community: true,
        votes: true,
      },
    });

    return NextResponse.json({ placement }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create placement" },
      { status: 500 }
    );
  }
}
