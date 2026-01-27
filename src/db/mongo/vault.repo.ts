import { VaultModel, IVault } from "./vault.model.js";

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

// DELETE
export const deleteVaultItem = async (id: string): Promise<void> => {
  await VaultModel.findByIdAndDelete(id).exec();
};
