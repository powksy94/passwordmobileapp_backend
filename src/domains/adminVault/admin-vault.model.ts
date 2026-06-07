import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminVaultItem extends Document {
  adminId:       string;
  name:          string;
  type:          'note' | 'file';
  fileName?:     string;
  encryptedData: string; // base64 — chiffré côté client (AES-256-GCM)
  iv:            string; // base64 — IV AES-GCM
  createdAt:     Date;
  updatedAt:     Date;
}

const AdminVaultItemSchema = new Schema<IAdminVaultItem>(
  {
    adminId:       { type: String, required: true, index: true },
    name:          { type: String, required: true },
    type:          { type: String, enum: ['note', 'file'], required: true },
    fileName:      { type: String },
    encryptedData: { type: String, required: true },
    iv:            { type: String, required: true },
  },
  { timestamps: true }
);

export const AdminVaultModel =
  mongoose.model<IAdminVaultItem>('AdminVaultItem', AdminVaultItemSchema);
