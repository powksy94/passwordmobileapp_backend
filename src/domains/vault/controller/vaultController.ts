import { Request, Response } from "express";
import * as VaultRepo from "../repo/vault.repo.js";
import { validatePasswordItem } from "../validation/password.validation.js";
import { validatePinItem } from "../validation/pin.validation.js";
import logger from "../../../shared/config/logger";

// ---------------------
// ADD VAULT ITEM
// ---------------------
export const addVaultItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = req.body.type === 'pin'
    ? validatePinItem(req.body)
    : validatePasswordItem(req.body);

  if (!result.valid) {
    res.status(400).json({ message: result.message });
    return;
  }

  try {
    const vaultItem = await VaultRepo.createVault({
      userId: req.user.id,
      ...result.item,
    });

    res.status(201).json({
      id: vaultItem._id,
      message: "Item added"});
  } catch (error) {
    logger.error("Failed to add vault item", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to add vault item." });
  }
};

// ---------------------
// GET VAULT ITEMS
// ---------------------
export const getVault = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const items = await VaultRepo.getVaultByUser(req.user.id);

    const response = items.map(item => ({
      id: item._id,
      type: item.type ?? 'password',
      title: item.title,
      login: item.login,
      password: item.password,
      notes: item.notes,
      icon: item.icon,
      url: item.url ?? "",
      pin: item.pin ?? "",
      createdAt: item.createdAt,
    }));

    res.json(response);
  } catch (error) {
    logger.error("Failed to fetch vault items", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to fetch vault items." });
  }
};

// ---------------------
// UPDATE VAULT ITEM
// ---------------------
export const updateVaultItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  const result = req.body.type === 'pin'
    ? validatePinItem(req.body)
    : validatePasswordItem(req.body);

  if (!result.valid) {
    res.status(400).json({ message: result.message });
    return;
  }

  try {
    const item = await VaultRepo.getVaultById(id);

    if (!item) {
      res.status(404).json({ message: "Vault item not found." });
      return;
    }

    if (item.userId !== req.user.id) {
      res.status(403).json({ message: "Not authorized to update this item." });
      return;
    }

    await VaultRepo.updateVaultItem(id, result.item);

    logger.info("Vault item updated", { userId: req.user.id, vaultId: id });
    res.status(200).json({ message: "Item updated" });
  } catch (error) {
    logger.error("Failed to update vault item", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to update vault item." });
  }
};

// ---------------------
// DELETE VAULT ITEM
// ---------------------
export const deleteVaultItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    const item = await VaultRepo.getVaultById(id); // IVault | null

    if (!item) {
      res.status(404).json({ message: "Vault item not found." });
      return;
    }

    if (item.userId !== req.user.id) {
      res.status(403).json({ message: "Not authorized to delete this item." });
      return;
    }

    await VaultRepo.deleteVaultItem(id);

    logger.info("Vault item deleted", { userId: req.user.id, vaultId: id });
    res.status(204).send();
  } catch (error) {
    logger.error("Failed to delete vault item", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to delete vault item." });
  }
};

// ---------------------
// PURGE ALL VAULT ITEMS (reset coffre)
// ---------------------
export const purgeVault = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    await VaultRepo.deleteAllVaultItemsByUser(req.user.id);
    logger.info("Vault purged", { userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    logger.error("Failed to purge vault", { error, userId: req.user.id });
    res.status(500).json({ message: "Failed to purge vault." });
  }
};
