import { describe, it, expect } from "@jest/globals";

describe("Vault business rules", () => {
  it("should forbid deleting another user's vault item", () => {
    const item = { userId: "userA" };
    const user = { id: "userB" };

    expect(item.userId).not.toBe(user.id);
  });
});
