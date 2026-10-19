import mongoose from "mongoose";
import { VaultModel } from "../model/vault.model.js";

// WEAK/MEDIUM REMINDER CANDIDATES (push reminder job) - groups tracked
// (weak or medium) items by user, without ever reading the decrypted content.
export interface WeakReminderCandidateItem {
  id: string;
  category: 'weak' | 'medium';
  weakSince: Date;
  weakReminderStage: 0 | 1 | 2 | 3;
}

export interface WeakReminderCandidate {
  userId: string;
  items: WeakReminderCandidateItem[];
}

// `onlyUserId` restricts the scan to a single user (manual test script).
export const getVaultWeakReminderCandidates = async (
  onlyUserId?: string
): Promise<WeakReminderCandidate[]> => {
  const results = await VaultModel.aggregate([
    { $match: { weakSince: { $ne: null }, ...(onlyUserId ? { userId: onlyUserId } : {}) } },
    {
      $project: {
        userId: 1,
        weakSince: 1,
        weakReminderStage: 1,
        category: { $cond: [{ $eq: ['$type', 'pin'] }, '$pin_strength', '$strength'] },
      },
    },
    { $match: { category: { $in: ['weak', 'medium'] } } },
    {
      $group: {
        _id: '$userId',
        items: {
          $push: {
            id: '$_id',
            category: '$category',
            weakSince: '$weakSince',
            weakReminderStage: '$weakReminderStage',
          },
        },
      },
    },
  ]);

  return results.map((r) => ({
    userId: r._id as string,
    items: (r.items as Array<{ id: unknown; category: 'weak' | 'medium'; weakSince: Date; weakReminderStage: 0 | 1 | 2 | 3 }>)
      .map((i) => ({ ...i, id: String(i.id) })),
  }));
};

export const bumpWeakReminderStages = async (
  updates: { id: string; stage: 0 | 1 | 2 | 3 }[]
): Promise<void> => {
  if (updates.length === 0) return;
  await VaultModel.bulkWrite(
    updates.map((u) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(u.id) },
        update: { $set: { weakReminderStage: u.stage } },
      },
    }))
  );
};
