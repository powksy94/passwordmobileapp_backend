import cron from "node-cron";
import logger from "../../../shared/config/logger";
import { deleteStaleRefreshTokens } from "../repo/refreshTokens.repo.js";
import { deleteStaleCodes } from "../repo/passwordResets.repo.js";

// Daily purge (04:00 server time) of expired / long-revoked refresh tokens
// and of expired password reset codes.
export const startRefreshTokenCleanupJob = (): void => {
  cron.schedule("0 4 * * *", () => {
    deleteStaleRefreshTokens()
      .then((count) => logger.info("Stale refresh tokens purged", { count }))
      .catch((err) => logger.error("Refresh token cleanup failed", { err }));
    deleteStaleCodes()
      .then((count) => logger.info("Stale password reset codes purged", { count }))
      .catch((err) => logger.error("Password reset code cleanup failed", { err }));
  });
};
