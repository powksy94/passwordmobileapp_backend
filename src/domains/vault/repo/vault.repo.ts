import mongoose from "mongoose";
import { VaultModel, IVault } from "../model/vault.model.js";

export interface ReencryptItem {
  id: string;
  type: 'password' | 'pin';
  title: string;
  login: string;
  password: string;
  notes: string;
  icon: string;
  url: string;
  pin: string;
}

// CREATE
export const createVault = async (
  data: Partial<IVault>
): Promise<IVault> => {
  const vault = new VaultModel(data);
  return vault.save();
};

// GET ALL BY USER
export const getVaultByUser = async (
  userId: string
): Promise<IVault[]> => {
  return VaultModel.find({ userId }).exec();
};

// GET BY ID
export const getVaultById = async (
  id: string
): Promise<IVault | null> => {
  return VaultModel.findById(id).exec();
};

// UPDATE
export const updateVaultItem = async (
  id: string,
  data: Partial<Pick<IVault, 'type' | 'title' | 'login' | 'password' | 'notes' | 'icon' | 'url' | 'strength' | 'pin' | 'pin_strength'>>
): Promise<IVault | null> => {
  return VaultModel.findByIdAndUpdate(id, data, { new: true }).exec();
};

// DELETE
export const deleteVaultItem = async (id: string): Promise<void> => {
  await VaultModel.findByIdAndDelete(id).exec();
};

// DELETE ALL (reset coffre)
export const deleteAllVaultItemsByUser = async (userId: string): Promise<void> => {
  await VaultModel.deleteMany({ userId }).exec();
};

// BULK RE-ENCRYPT (changement du mot de passe maître) — transaction tout-ou-rien :
// si un seul item échoue (introuvable, appartenant à un autre utilisateur, etc.),
// MongoDB annule automatiquement toutes les écritures déjà effectuées dans la session.
export const reencryptVaultItems = async (
  userId: string,
  items: ReencryptItem[]
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        const existing = await VaultModel.findById(item.id).session(session);
        if (!existing || existing.userId !== userId) {
          throw new Error(`Vault item not found or not owned by user: ${item.id}`);
        }
        await VaultModel.findByIdAndUpdate(
          item.id,
          {
            type:     item.type,
            title:    item.title,
            login:    item.login,
            password: item.password,
            notes:    item.notes,
            icon:     item.icon,
            url:      item.url,
            pin:      item.pin,
          },
          { session }
        ).exec();
      }
    });
  } finally {
    await session.endSession();
  }
};

// STRENGTH STATS (panel admin) — agrégation de comptage par catégorie,
// sans jamais lire ni déchiffrer le contenu des items.
export interface VaultStrengthStats {
  total: number;
  strong: number;
  medium: number;
  weak: number;
  unrated: number;
}

export const getVaultStrengthStats = async (userId: string): Promise<VaultStrengthStats> => {
  // Exclut les PINs : ils ont leur propre catégorie de robustesse (pin_strength),
  // pas comparable à celle des mots de passe.
  const results = await VaultModel.aggregate([
    { $match: { userId, type: { $ne: 'pin' } } },
    { $group: { _id: '$strength', count: { $sum: 1 } } },
  ]);

  const stats: VaultStrengthStats = { total: 0, strong: 0, medium: 0, weak: 0, unrated: 0 };
  for (const r of results) {
    const key = (r._id ?? 'unrated') as 'strong' | 'medium' | 'weak' | 'unrated';
    stats[key] = r.count;
    stats.total += r.count;
  }
  return stats;
};
