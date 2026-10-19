export type StrengthCategory = 'weak' | 'medium' | 'strong' | undefined;

export const isTrackedCategory = (s: StrengthCategory): boolean =>
  s === 'weak' || s === 'medium';

export interface WeakTrackingState {
  weakSince: Date | null;
  weakReminderStage: 0 | 1 | 2 | 3;
}

export const defaultWeakTrackingState: WeakTrackingState = {
  weakSince: null,
  weakReminderStage: 0,
};

// Tracks the "weak or medium" episode of a vault item, independently of any
// user's "include medium" reminder preference (that preference is only
// applied when the reminder job reads this state, never when writing it -
// see upgrade/WEAK_ITEM_PUSH_REMINDERS.md).
export const computeWeakTracking = (
  previous: StrengthCategory,
  next: StrengthCategory,
  current: WeakTrackingState,
  now: Date = new Date()
): WeakTrackingState => {
  const wasTracked = isTrackedCategory(previous);
  const isTracked = isTrackedCategory(next);

  if (!wasTracked && isTracked) {
    return { weakSince: now, weakReminderStage: 0 };
  }
  if (wasTracked && !isTracked) {
    return { weakSince: null, weakReminderStage: 0 };
  }
  // tracked -> tracked (same or crossed weak/medium) or untracked -> untracked.
  return current;
};
