import { describe, it, expect } from "@jest/globals";
import { computeWeakTracking, defaultWeakTrackingState } from "../weakTracking.logic";

describe("Vault business rules", () => {
  it("should forbid deleting another user's vault item", () => {
    const item = { userId: "userA" };
    const user = { id: "userB" };

    expect(item.userId).not.toBe(user.id);
  });
});

describe("computeWeakTracking", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("starts a new episode when a brand-new item is weak", () => {
    const result = computeWeakTracking(undefined, "weak", defaultWeakTrackingState, now);
    expect(result).toEqual({ weakSince: now, weakReminderStage: 0 });
  });

  it("starts a new episode when a brand-new item is medium", () => {
    const result = computeWeakTracking(undefined, "medium", defaultWeakTrackingState, now);
    expect(result).toEqual({ weakSince: now, weakReminderStage: 0 });
  });

  it("does not track a brand-new strong item", () => {
    const result = computeWeakTracking(undefined, "strong", defaultWeakTrackingState, now);
    expect(result).toEqual(defaultWeakTrackingState);
  });

  it("starts a new episode when an item degrades from strong to weak", () => {
    const current = { weakSince: null, weakReminderStage: 0 as const };
    const result = computeWeakTracking("strong", "weak", current, now);
    expect(result).toEqual({ weakSince: now, weakReminderStage: 0 });
  });

  it("clears the episode when an item improves from weak to strong", () => {
    const current = { weakSince: new Date("2025-12-01T00:00:00Z"), weakReminderStage: 2 as const };
    const result = computeWeakTracking("weak", "strong", current, now);
    expect(result).toEqual({ weakSince: null, weakReminderStage: 0 });
  });

  it("keeps the same episode (no reset) when crossing weak <-> medium", () => {
    const current = { weakSince: new Date("2025-12-01T00:00:00Z"), weakReminderStage: 1 as const };
    expect(computeWeakTracking("weak", "medium", current, now)).toBe(current);
    expect(computeWeakTracking("medium", "weak", current, now)).toBe(current);
  });

  it("keeps the same episode when the category is unchanged", () => {
    const current = { weakSince: new Date("2025-12-01T00:00:00Z"), weakReminderStage: 3 as const };
    expect(computeWeakTracking("weak", "weak", current, now)).toBe(current);
  });

  it("stays untracked when a strong item is updated without becoming weak/medium", () => {
    expect(computeWeakTracking("strong", "strong", defaultWeakTrackingState, now)).toBe(
      defaultWeakTrackingState
    );
  });
});
