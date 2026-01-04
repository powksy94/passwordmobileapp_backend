import mongoose, { Schema, Document } from "mongoose";

export interface IVault extends Document {
  userId: string;
  encryptedValue: string;
  iv: string;
  tag: string;
  createdAt: Date;
}

const VaultSchema = new Schema<IVault>({
  userId: { type: String, required: true },
  encryptedValue: { type: String, required: true },
  iv: { type: String, required: true },
  tag: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const VaultModel = mongoose.model<IVault>("Vault", VaultSchema);
