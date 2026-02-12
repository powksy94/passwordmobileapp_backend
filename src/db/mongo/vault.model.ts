import mongoose, { Schema, Document} from "mongoose";

export interface IVault extends Document {
  userId: string;
  title: string;
  login: string;
  password: string;
  notes: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    login: { type: String, default: ""},
    password: { type: String, required: true},
    notes: { type: String, default: ""},
    icon: { type: String, default: "lock"}
  },
  {
    timestamps: true, 
  }
);

export const VaultModel = mongoose.model<IVault>("Vault", VaultSchema);