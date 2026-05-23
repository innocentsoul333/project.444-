// lib/moderation.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ModerationResult = {
  approved: boolean;
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  raw: unknown;
};

export async function moderateText(input: string): Promise<ModerationResult> {
  if (!input.trim()) {
    return {
      approved: true,
      flagged: false,
      categories: {},
      categoryScores: {},
      raw: null,
    };
  }

  const result = await client.moderations.create({
    model: "omni-moderation-latest",
    input,
  });

  const item = result.results?.[0];

  return {
    approved: !item?.flagged,
    flagged: Boolean(item?.flagged),
    categories: (item?.categories ?? {}) as Record<string, boolean>,
    categoryScores: (item?.category_scores ?? {}) as Record<string, number>,
    raw: result,
  };
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const result = await client.moderations.create({
    model: "omni-moderation-latest",
    input: [
      {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      },
    ],
  });

  const item = result.results?.[0];

  return {
    approved: !item?.flagged,
    flagged: Boolean(item?.flagged),
    categories: (item?.categories ?? {}) as Record<string, boolean>,
    categoryScores: (item?.category_scores ?? {}) as Record<string, number>,
    raw: result,
  };
}
