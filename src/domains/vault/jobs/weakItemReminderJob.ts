import cron from "node-cron";
import * as UsersRepo from "../../../shared/db/postgres/users.repo";
import firebaseAdmin from "../../../shared/config/firebase-admin.js";
import logger from "../../../shared/config/logger";
import {
  getVaultWeakReminderCandidates,
  bumpWeakReminderStages,
} from "../repo/weakReminder.repo.js";
import { WEAK_REMINDER_MESSAGES, type SupportedLocale } from "./weakItemReminderMessages.js";

const WEAK_REMINDER_CHANNEL_ID = "weak_reminders";

export const startWeakItemReminderJob = (): void => {
  cron.schedule("*/30 * * * *", () => {
    runWeakItemReminderTick().catch((err) => {
      logger.error("Weak item reminder job failed", { err });
    });
  });
};

export const runWeakItemReminderTick = async (): Promise<void> => {
  const candidates = await getVaultWeakReminderCandidates();
  const now = Date.now();

  for (const { userId, items } of candidates) {
    const user = await UsersRepo.getUserById(userId);
    if (!user || !user.weak_reminders_enabled || !user.fcm_token) continue;

    const delays = user.weak_reminder_delays_hours;
    const eligibleItems = user.weak_reminders_include_medium
      ? items
      : items.filter((i) => i.category === "weak");

    if (eligibleItems.length === 0) continue;

    const bumps: { id: string; stage: 0 | 1 | 2 | 3 }[] = [];
    let maxStageCrossed = 0;

    for (const item of eligibleItems) {
      const elapsedHours = (now - new Date(item.weakSince).getTime()) / 3_600_000;
      let stage = item.weakReminderStage;
      for (let s = 1 as 0 | 1 | 2 | 3; s <= 3; s++) {
        if (elapsedHours >= delays[s - 1] && s > item.weakReminderStage) {
          stage = s;
        }
      }
      if (stage > item.weakReminderStage) {
        bumps.push({ id: item.id, stage });
        maxStageCrossed = Math.max(maxStageCrossed, stage);
      }
    }

    if (bumps.length === 0) continue;

    await bumpWeakReminderStages(bumps);

    const text = WEAK_REMINDER_MESSAGES[user.locale as SupportedLocale] ?? WEAK_REMINDER_MESSAGES.en;

    try {
      await firebaseAdmin.messaging().send({
        token: user.fcm_token,
        data: { type: "weak_item_reminder" },
        notification: {
          title: text.title,
          body: text.body(eligibleItems.length),
        },
        android: {
          priority: "high",
          notification: { channelId: WEAK_REMINDER_CHANNEL_ID },
        },
      });
      logger.info("Weak item reminder push sent", {
        userId,
        stage: maxStageCrossed,
        count: eligibleItems.length,
      });
    } catch (err) {
      logger.error("Weak item reminder FCM send failed", { userId, err });
    }
  }
};
