import { Request, Response } from "express";
import * as VaultRepo from "../repo/vault.repo.js";
import type { ReencryptItem } from "../repo/vault.repo.js";
import { validatePasswordItem } from "../validation/password.validation.js";
import { validatePinItem } from "../validation/pin.validation.js";
import logger from "../../../shared/config/logger";

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

  const validated: ReencryptItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw.id !== "string") {
      res.status(400).json({ message: "Each item requires an id." });
      return;
    }

    if (raw.type === 'pin') {
      const result = validatePinItem(raw);
      if (!result.valid) {
        res.status(400).json({ message: `Item ${raw.id}: ${result.message}` });
        return;
      }
      validated.push({
        id: raw.id,
        type: 'pin',
        title: result.item.title,
        notes: result.item.notes,
        pin: result.item.pin,
        login: "", password: "", icon: "lock", url: "",
      });
    } else {
      const result = validatePasswordItem(raw);
      if (!result.valid) {
        res.status(400).json({ message: `Item ${raw.id}: ${result.message}` });
        return;
      }
      validated.push({
        id: raw.id,
        type: 'password',
        title: result.item.title,
        login: result.item.login,
        password: result.item.password,
        notes: result.item.notes,
        icon: result.item.icon,
        url: result.item.url,
        pin: "",
      });
    }
  }

  try {
    await VaultRepo.reencryptVaultItems(req.user.id, validated);

    logger.info("Vault re-encrypted (master password change)", { userId: req.user.id, count: items.length });
    res.status(200).json({ message: "Vault re-encrypted", count: items.length });
  } catch (error) {
    logger.error("Failed to re-encrypt vault — transaction rolled back", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to re-encrypt vault. No changes were applied." });
  }
};
