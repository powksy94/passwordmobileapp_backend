import { Request, Response } from "express";
import * as VaultRepo from "./vault.repo.js";
import logger from "../../shared/config/logger";

// ---------------------
// BULK RE-ENCRYPT (changement du mot de passe maître)
// ---------------------
export const reencryptVault = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "items must be a non-empty array." });
    return;
  }

  for (const item of items) {
    if (!item || typeof item.id !== "string" || !item.title || !item.password) {
      res.status(400).json({ message: "Each item requires id, title and password." });
      return;
    }
  }

  try {
    await VaultRepo.reencryptVaultItems(
      req.user.id,
      items.map((item) => ({
        id:       item.id,
        title:    item.title,
        login:    item.login ?? "",
        password: item.password,
        notes:    item.notes ?? "",
        icon:     item.icon ?? "lock",
        url:      item.url ?? "",
      }))
    );

    logger.info("Vault re-encrypted (master password change)", { userId: req.user.id, count: items.length });
    res.status(200).json({ message: "Vault re-encrypted", count: items.length });
  } catch (error) {
    logger.error("Failed to re-encrypt vault — transaction rolled back", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to re-encrypt vault. No changes were applied." });
  }
};
