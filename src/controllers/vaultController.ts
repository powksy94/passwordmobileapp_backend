import { Request, Response } from "express";
import * as VaultRepo from "../db/mongo/vault.repo.js";
import { encryptValue, decryptValue } from "../config/crypto.js";

export const addVaultItem = async (req: Request, res: Response) => {
  const { value, label } = req.body;
  const { encryptedValue, iv, tag } = encryptValue(value);

  const vaultItem = await VaultRepo.createVault({
    userId: req.user.id,
    encryptedValue,
    iv,
    tag,
    label
  });

  res.status(201).json(vaultItem);
};

export const getVault = async (req: Request, res: Response) => {
  const items = await VaultRepo.getVaultByUser(req.user.id);
  res.json(items.map(item => ({
    ...item.toObject(),
    value: decryptValue(item.encryptedValue, item.iv, item.tag)
  })));
};

export const deleteVaultItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  await VaultRepo.deleteVaultItem(id);
  res.status(204).send();
};
