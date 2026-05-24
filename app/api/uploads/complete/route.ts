// app/api/uploads/complete/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      key,
      bucket,
      fileName,
      fileType,
      fileSize,
      purpose = "post",
      communityId = null,
      postId = null,
      storyId = null,
      placementId = null,
    } = body ?? {};

    if (!key || !bucket || !fileName || !fileType || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "key, bucket, fileName, fileType, and fileSize are required" },
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

    const media = await prisma.mediaAttachment.create({
      data: {
        postId,
        storyId,
        placementId,
        url: `s3://${bucket}/${key}`,
        fileName,
        fileType,
        fileSize,
        storageProvider: "s3",
        purpose,
        communityId,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 }
    );
  }
}
