// app/api/moderation/analyze/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { moderateText, moderateImage } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyzeBody = {
  text?: string;
  imageUrl?: string;
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as AnalyzeBody;
    const text = body?.text?.trim();
    const imageUrl = body?.imageUrl?.trim();

    if (!text && !imageUrl) {
      return NextResponse.json(
        { error: "text or imageUrl is required" },
        { status: 400 }
      );
    }

    const result = imageUrl
      ? await moderateImage(imageUrl)
      : await moderateText(text as string);

    return NextResponse.json({
      approved: result.approved,
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.categoryScores,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}
