import { Request, Response } from "express";
import * as VaultRepo from "../db/mongo/vault.repo.js";
import { encryptValue, decryptValue } from "../config/crypto.js";
import logger from "../config/logger";

// ---------------------
// ADD VAULT ITEM
// ---------------------
export const addVaultItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, label } = req.body;

    // validation simple
    if (!value || !label) {
      logger.warn("Add vault item failed: missing value or label", { userId: req.user.id });
      return res.status(400).json({ message: "Value and label are required." });
    }

    const { encryptedValue, iv, tag } = encryptValue(value);

    const vaultItem = await VaultRepo.createVault({
      userId: req.user.id,
      label,
      encryptedValue,
      iv,
      tag,
    });

    logger.info("Vault item added successfully", { userId: req.user.id, vaultId: vaultItem._id });

    // réponse sécurisée
    res.status(201).json({
      id: vaultItem._id,
      label: vaultItem.label,
      createdAt: vaultItem.createdAt,
    });
  } catch (err) {
    logger.error("Failed to add vault item", { error: err, userId: req.user?.id });
    res.status(500).json({ message: "Failed to add vault item." });
  }
};

// ---------------------
// GET VAULT ITEMS
// ---------------------
export const getVault = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const items = await VaultRepo.getVaultByUser(req.user.id);

    const response = items.map(item => ({
      id: item._id,
      label: item.label,
      value: decryptValue(item.encryptedValue, item.iv, item.tag),
      createdAt: item.createdAt,
    }));

    res.json(response);
  } catch (err) {
    logger.error("Failed to fetch vault items", { error: err, userId: req.user?.id });
    res.status(500).json({ message: "Failed to fetch vault items." });
  }
};

// ---------------------
// DELETE VAULT ITEM
// ---------------------
export const deleteVaultItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    // récupérer l'item pour vérifier la propriété
    const item = await VaultRepo.getVaultById(id); // doit retourner IVault | null

    if (!item) {
      return res.status(404).json({ message: "Vault item not found." });
    }

    if (item.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this item." });
    }

    await VaultRepo.deleteVaultItem(id);

    logger.info("Vault item deleted", { userId: req.user.id, vaultId: id });
    res.status(204).send();
  } catch (err) {
    logger.error("Failed to delete vault item", { error: err, userId: req.user?.id });
    res.status(500).json({ message: "Failed to delete vault item." });
  }
};
