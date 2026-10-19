import cron from "node-cron";
import logger from "../../../shared/config/logger";
import { deleteStaleRefreshTokens } from "../repo/refreshTokens.repo.js";

// Daily purge of expired / long-revoked refresh tokens (04:00 server time).
export const startRefreshTokenCleanupJob = (): void => {
  cron.schedule("0 4 * * *", () => {
    deleteStaleRefreshTokens()
      .then((count) => logger.info("Stale refresh tokens purged", { count }))
      .catch((err) => logger.error("Refresh token cleanup failed", { err }));
  });
};
