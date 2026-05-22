import { AdminVaultModel, IAdminVaultItem } from './admin-vault.model.js';

export const getItemsByAdmin = (adminId: string): Promise<IAdminVaultItem[]> =>
  AdminVaultModel.find({ adminId }).sort({ createdAt: -1 }).exec();

export const createItem = (
  data: Pick<IAdminVaultItem, 'adminId' | 'name' | 'type' | 'encryptedData' | 'iv'> &
        { fileName?: string }
): Promise<IAdminVaultItem> =>
  AdminVaultModel.create(data);

export const deleteItem = async (id: string, adminId: string): Promise<boolean> => {
  const res = await AdminVaultModel.deleteOne({ _id: id, adminId }).exec();
  return res.deletedCount === 1;
};
