# project.444-

## Production DB migration and report backfill

Use this rollout order when deploying schema changes safely:

1. Take a database backup/snapshot.
2. Apply schema migration:
   - local/dev: `npm run db:migrate`
   - production: `npm run db:migrate:deploy`
3. Backfill legacy report target links:
   - `npm run db:backfill:reports`
4. Verify:
   - sample `Report` rows now have one of `targetUserId/postId/commentId/alertId/pollId/placementId/communityId`
   - moderation/report APIs return linked targets correctly

This project also performs lazy backfill on read in report APIs to support old rows, but the script above should still be run once in production for complete consistency.