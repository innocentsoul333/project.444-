// app/api/uploads/presign/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      fileName,
      fileType,
      fileSize,
      folder = "uploads",
    } = body ?? {};

    if (!fileName || !fileType || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "fileName, fileType, and fileSize are required" },
        { status: 400 }
      );
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      return NextResponse.json(
        { error: "AWS_S3_BUCKET is not configured" },
        { status: 500 }
      );
    }

    const safeName = `${Date.now()}-${fileName}`.replace(/\s+/g, "-");
    const key = `${folder}/${userId}/${safeName}`;

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const uploadUrl = await getSignedUrl(s3, putCommand, {
      expiresIn: 60 * 10,
    });

    const previewUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: 60 * 10,
    });

    return NextResponse.json({
      uploadUrl,
      previewUrl,
      key,
      bucket,
      fileName,
      fileType,
      fileSize,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
