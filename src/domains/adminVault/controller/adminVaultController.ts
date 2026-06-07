import { Request, Response } from 'express';
import * as AdminVaultRepo from '../repo/admin-vault.repo.js';
import * as AdminVaultConfigRepo from '../repo/admin-vault-config.repo.js';

// ── 3. GET /admin/vault ───────────────────────────────────────────────────────
// Retourne { salt, items[] }

export const getAdminVault = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const config = await AdminVaultConfigRepo.getOrCreateConfig(req.user.id);
  const items  = await AdminVaultRepo.getItemsByAdmin(req.user.id);

  res.status(200).json({
    salt:  config.vault_salt,
    items: items.map(i => ({
      id:            i._id,
      name:          i.name,
      type:          i.type,
      fileName:      i.fileName,
      encryptedData: i.encryptedData,
      iv:            i.iv,
      createdAt:     i.createdAt,
    })),
  });
};

// ── 4. POST /admin/vault ──────────────────────────────────────────────────────
// Ajoute un item chiffré

export const createAdminVaultItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { name, type, fileName, encryptedData, iv } = req.body as {
    name:          string;
    type:          'note' | 'file';
    fileName?:     string;
    encryptedData: string;
    iv:            string;
  };

  if (!name || !type || !encryptedData || !iv) {
    res.status(400).json({ error: 'name, type, encryptedData et iv sont requis' });
    return;
  }

  const item = await AdminVaultRepo.createItem({
    adminId: req.user.id,
    name,
    type,
    fileName,
    encryptedData,
    iv,
  });

  res.status(201).json({
    id:            item._id,
    name:          item.name,
    type:          item.type,
    fileName:      item.fileName,
    encryptedData: item.encryptedData,
    iv:            item.iv,
    createdAt:     item.createdAt,
  });
};

// ── 5. DELETE /admin/vault/:id ────────────────────────────────────────────────

export const deleteAdminVaultItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const deleted = await AdminVaultRepo.deleteItem(req.params.id, req.user.id);
  if (!deleted) { res.status(404).json({ error: 'Item introuvable' }); return; }

  res.status(204).send();
};
