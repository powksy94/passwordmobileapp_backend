import { VaultModel, IVault } from "./vault.model.js";

export const createVault = async (data: Partial<IVault>) => {
  const vault = new VaultModel(data);
  return await vault.save();
};

export const getVaultByUser = async (userId: string) => {
  return await VaultModel.find({ userId });
};

export const deleteVaultItem = async (id: string) => {
  return await VaultModel.findByIdAndDelete(id);
};
