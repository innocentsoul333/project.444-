type ReportTargetType =
  | "user"
  | "post"
  | "comment"
  | "alert"
  | "poll"
  | "placement"
  | "community";

type TargetPatch = {
  targetId: string;
  targetUserId?: string;
  postId?: string;
  commentId?: string;
  alertId?: string;
  pollId?: string;
  placementId?: string;
  communityId?: string;
};

type LegacyReportLike = {
  id: string;
  targetType: string;
  targetId: string | null;
  targetUserId: string | null;
  postId: string | null;
  commentId: string | null;
  alertId: string | null;
  pollId: string | null;
  placementId: string | null;
  communityId: string | null;
};

const TARGET_TYPES: Set<ReportTargetType> = new Set([
  "user",
  "post",
  "comment",
  "alert",
  "poll",
  "placement",
  "community",
]);

export function isValidReportTargetType(targetType: string): boolean {
  return TARGET_TYPES.has(targetType as ReportTargetType);
}

export function buildReportTargetPatch(
  targetType: string,
  targetId: string
): TargetPatch | null {
  if (!isValidReportTargetType(targetType)) return null;

  const patch: TargetPatch = { targetId };
  if (targetType === "user") patch.targetUserId = targetId;
  if (targetType === "post") patch.postId = targetId;
  if (targetType === "comment") patch.commentId = targetId;
  if (targetType === "alert") patch.alertId = targetId;
  if (targetType === "poll") patch.pollId = targetId;
  if (targetType === "placement") patch.placementId = targetId;
  if (targetType === "community") patch.communityId = targetId;
  return patch;
}

export function buildLegacyBackfillPatch(report: LegacyReportLike): TargetPatch | null {
  if (!report.targetId) return null;
  if (
    report.targetUserId ||
    report.postId ||
    report.commentId ||
    report.alertId ||
    report.pollId ||
    report.placementId ||
    report.communityId
  ) {
    return null;
  }
  return buildReportTargetPatch(report.targetType, report.targetId);
}
