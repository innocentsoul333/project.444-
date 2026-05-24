// app/api/webhooks/clerk/route.ts
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
};

export async function POST(req: Request) {
  try {
    const payload = await req.text();

    const headers = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);
    const evt = wh.verify(payload, headers) as ClerkWebhookEvent;

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const primaryEmail =
        evt.data.email_addresses?.[0]?.email_address ?? "";

      await prisma.user.upsert({
        where: {
          clerkUserId: evt.data.id,
        },
        update: {
          email: primaryEmail,
          name: [evt.data.first_name, evt.data.last_name]
            .filter(Boolean)
            .join(" "),
          avatarUrl: evt.data.image_url ?? null,
        },
        create: {
          clerkUserId: evt.data.id,
          email: primaryEmail,
          name: [evt.data.first_name, evt.data.last_name]
            .filter(Boolean)
            .join(" "),
          avatarUrl: evt.data.image_url ?? null,
        },
      });
    }

    if (evt.type === "user.deleted") {
      await prisma.user.updateMany({
        where: { clerkUserId: evt.data.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }
}
