import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const sendMock = jest.fn<(msg: any) => Promise<string>>();
const getUserByIdMock = jest.fn<(id: string) => Promise<any>>();
const getCandidatesMock = jest.fn<(onlyUserId?: string) => Promise<any>>();
const bumpStagesMock = jest.fn<(updates: any) => Promise<void>>();

jest.mock("../../../shared/config/firebase-admin.js", () => ({
  __esModule: true,
  default: { messaging: () => ({ send: sendMock }) },
}));
jest.mock("../../../shared/config/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));
jest.mock("../../../shared/db/postgres/users.repo", () => ({
  getUserById: getUserByIdMock,
}));
jest.mock("../repo/weakReminder.repo.js", () => ({
  getVaultWeakReminderCandidates: getCandidatesMock,
  bumpWeakReminderStages: bumpStagesMock,
}));

import { runWeakItemReminderTick } from "../jobs/weakItemReminderJob";

const HOUR = 3_600_000;
const DELAYS = [4, 24, 48];

const user = (overrides: Record<string, unknown> = {}) => ({
  id: "user1",
  fcm_token: "fcm-token",
  locale: "fr",
  weak_reminders_enabled: true,
  weak_reminders_include_medium: true,
  weak_reminder_delays_hours: DELAYS,
  ...overrides,
});

const item = (id: string, category: "weak" | "medium", hoursAgo: number, stage: 0 | 1 | 2 | 3) => ({
  id,
  category,
  weakSince: new Date(Date.now() - hoursAgo * HOUR),
  weakReminderStage: stage,
});

const givenCandidates = (items: ReturnType<typeof item>[], u = user()) => {
  getCandidatesMock.mockResolvedValue([{ userId: u.id, items }]);
  getUserByIdMock.mockResolvedValue(u);
};

describe("runWeakItemReminderTick", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMock.mockResolvedValue("message-id");
  });

  describe.each([
    { stage: 1, hoursAgo: DELAYS[0] + 0.1, from: 0 },
    { stage: 2, hoursAgo: DELAYS[1] + 0.1, from: 1 },
    { stage: 3, hoursAgo: DELAYS[2] + 0.1, from: 2 },
  ] as const)("stage $stage", ({ stage, hoursAgo, from }) => {
    it(`bumps the item from ${from} to ${stage} and sends one push once its delay is reached`, async () => {
      givenCandidates([item("a", "weak", hoursAgo, from)]);

      await runWeakItemReminderTick();

      expect(bumpStagesMock).toHaveBeenCalledWith([{ id: "a", stage }]);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0][0]).toMatchObject({
        token: "fcm-token",
        data: { type: "weak_item_reminder" },
        android: { notification: { channelId: "weak_reminders" } },
      });
    });

    it("sends nothing again when the same stage was already reached", async () => {
      givenCandidates([item("a", "weak", hoursAgo, stage)]);

      await runWeakItemReminderTick();

      expect(bumpStagesMock).not.toHaveBeenCalled();
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("sends nothing just before the stage delay", async () => {
      givenCandidates([item("a", "weak", DELAYS[stage - 1] - 0.1, from)]);

      await runWeakItemReminderTick();

      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  it("jumps straight to the highest due stage with a single push", async () => {
    givenCandidates([item("a", "weak", DELAYS[2] + 1, 0)]);

    await runWeakItemReminderTick();

    expect(bumpStagesMock).toHaveBeenCalledWith([{ id: "a", stage: 3 }]);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("sends nothing after the last stage", async () => {
    givenCandidates([item("a", "weak", 1000, 3)]);

    await runWeakItemReminderTick();

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("counts every eligible item in the push body, in the user's locale", async () => {
    givenCandidates([item("a", "weak", DELAYS[0] + 1, 0), item("b", "medium", 1, 0)]);

    await runWeakItemReminderTick();

    expect(sendMock.mock.calls[0][0]).toMatchObject({
      notification: {
        title: "Rappel de sécurité",
        body: "Vous avez 2 mots de passe/PIN à renforcer.",
      },
    });
  });

  it("ignores medium items when include_medium is off", async () => {
    givenCandidates(
      [item("a", "medium", DELAYS[0] + 1, 0)],
      user({ weak_reminders_include_medium: false })
    );

    await runWeakItemReminderTick();

    expect(bumpStagesMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("uses the user's custom delays", async () => {
    givenCandidates(
      [item("a", "weak", 2, 0)],
      user({ weak_reminder_delays_hours: [1, 3, 6] })
    );

    await runWeakItemReminderTick();

    expect(bumpStagesMock).toHaveBeenCalledWith([{ id: "a", stage: 1 }]);
  });

  it.each([
    ["reminders are disabled", { weak_reminders_enabled: false }],
    ["there is no FCM token", { fcm_token: null }],
  ])("sends nothing when %s", async (_label, overrides) => {
    givenCandidates([item("a", "weak", DELAYS[0] + 1, 0)], user(overrides));

    await runWeakItemReminderTick();

    expect(bumpStagesMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("scopes the scan to one user when asked", async () => {
    getCandidatesMock.mockResolvedValue([]);

    await runWeakItemReminderTick("user1");

    expect(getCandidatesMock).toHaveBeenCalledWith("user1");
  });
});
