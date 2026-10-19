import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { pool } from "../config/postgres";
import { connectMongo } from "../config/mongo";
import * as UsersRepo from "../db/postgres/users.repo";
import { VaultModel } from "../../domains/vault/model/vault.model";
import { runWeakItemReminderTick } from "../../domains/vault/jobs/weakItemReminderJob";

// Manual end-to-end check of the weak/medium push reminder: backdates the
// user's tracked items so that reminder stage N is due, then runs one job
// tick scoped to that user (real FCM push, real stage bump).
//
// Usage: npm run test-weak-reminder <email> [stage=1|2|3]

const email = process.argv[2];
const stage = Number(process.argv[3] ?? 1);

if (!email || ![1, 2, 3].includes(stage)) {
  console.error("Usage: npm run test-weak-reminder <email> [stage=1|2|3]");
  process.exit(1);
}

const categoryOf = (item: { type?: string; strength?: string; pin_strength?: string }) =>
  item.type === "pin" ? item.pin_strength : item.strength;

async function testWeakReminder() {
  const user = await UsersRepo.getUserByEmail(email);
  if (!user) throw new Error(`No user found with email: ${email}`);

  const delays = user.weak_reminder_delays_hours;
  console.log(`User ${user.email} (${user.id})`);
  console.log(`  enabled=${user.weak_reminders_enabled} includeMedium=${user.weak_reminders_include_medium}`);
  console.log(`  delaysHours=[${delays.join(", ")}] locale=${user.locale} fcmToken=${user.fcm_token ? "yes" : "MISSING"}`);

  if (!user.weak_reminders_enabled) console.warn("⚠️  Reminders are disabled: the job will skip this user.");
  if (!user.fcm_token) console.warn("⚠️  No FCM token: open the app logged in on a device first.");

  await connectMongo();

  const items = await VaultModel.find({ userId: user.id }).lean();
  const allowed = user.weak_reminders_include_medium ? ["weak", "medium"] : ["weak"];
  const eligible = items.filter((i) => allowed.includes(categoryOf(i) ?? "") && i.weakSince);
  const untracked = items.filter((i) => allowed.includes(categoryOf(i) ?? "") && !i.weakSince);

  if (untracked.length > 0) {
    console.warn(`⚠️  ${untracked.length} weak/medium item(s) have no weakSince (created before tracking?): ignored by the job.`);
  }
  if (eligible.length === 0) {
    throw new Error(`No eligible tracked item (allowed: ${allowed.join("/")}). Create or edit a weak item in the app.`);
  }

  // Due for `stage` but not yet for `stage + 1` (unless delays overlap).
  const backdateHours = delays[stage - 1] + 1 / 60;
  const weakSince = new Date(Date.now() - backdateHours * 3_600_000);

  await VaultModel.updateMany(
    { _id: { $in: eligible.map((i) => i._id) } },
    { $set: { weakSince, weakReminderStage: stage - 1 } }
  );

  console.log(`\nBackdated ${eligible.length} item(s) to ${weakSince.toISOString()} (stage ${stage - 1} -> ${stage} due):`);
  for (const i of eligible) console.log(`  - [${categoryOf(i)}] ${i.type ?? "password"} ${i._id}`);

  console.log("\nRunning reminder tick for this user...");
  await runWeakItemReminderTick(user.id);

  const after = await VaultModel.find({ _id: { $in: eligible.map((i) => i._id) } }, { weakReminderStage: 1 }).lean();
  const bumped = after.filter((i) => i.weakReminderStage === stage).length;
  console.log(`\n${bumped}/${eligible.length} item(s) now at stage ${stage}. Check the logs above for "Weak item reminder push sent".`);
}

testWeakReminder()
  .catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await pool.end();
  });
