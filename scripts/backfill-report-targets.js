/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function buildPatch(targetType, targetId) {
  if (!targetId) return null;
  if (targetType === "user") return { targetId, targetUserId: targetId };
  if (targetType === "post") return { targetId, postId: targetId };
  if (targetType === "comment") return { targetId, commentId: targetId };
  if (targetType === "alert") return { targetId, alertId: targetId };
  if (targetType === "poll") return { targetId, pollId: targetId };
  if (targetType === "placement") return { targetId, placementId: targetId };
  if (targetType === "community") return { targetId, communityId: targetId };
  return null;
}

async function main() {
  const reports = await prisma.report.findMany({
    where: {
      targetId: { not: null },
      targetUserId: null,
      postId: null,
      commentId: null,
      alertId: null,
      pollId: null,
      placementId: null,
      communityId: null,
    },
    select: {
      id: true,
      targetType: true,
      targetId: true,
    },
  });

  console.log(`Found ${reports.length} report(s) to backfill.`);

  let updated = 0;
  let skipped = 0;
  for (const report of reports) {
    const patch = buildPatch(report.targetType, report.targetId);
    if (!patch) {
      skipped += 1;
      continue;
    }

    await prisma.report.update({
      where: { id: report.id },
      data: patch,
    });
    updated += 1;
  }

  console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
