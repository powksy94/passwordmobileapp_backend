import { describe, it, expect, jest } from "@jest/globals";
import * as VaultRepo from "../repo/vault.repo";
import { VaultModel } from "../model/vault.model";

describe("Vault repository", () => {
  it("should create a vault item", async () => {
    const saveMock = jest
      .spyOn(VaultModel.prototype, "save")
      .mockResolvedValue({
        _id: "123",
        title: "Test",
        userId: "user1",
      } as any); // ← cast Mongoose doc

    const item = await VaultRepo.createVault({
      userId: "user1",
      title: "Test",
    });

    expect(item.title).toBe("Test");
    expect(item.userId).toBe("user1");

    saveMock.mockRestore();
  });
});
