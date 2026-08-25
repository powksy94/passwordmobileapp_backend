import mongoose, { Schema, Document} from "mongoose";

export interface IVault extends Document {
  userId: string;
  type: 'password' | 'pin';
  title: string;
  login: string;
  password: string;
  notes: string;
  icon: string;
  url: string;
  strength?: 'weak' | 'medium' | 'strong';
  pin: string;
  pin_strength?: 'weak' | 'medium' | 'strong';
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['password', 'pin'], default: 'password' },
    title: { type: String, required: true },
    login: { type: String, default: ""},
    // Non requis : un item de type 'pin' ne renseigne pas ce champ (il utilise `pin` à la place).
    password: { type: String, default: ""},
    notes: { type: String, default: ""},
    icon: { type: String, default: "lock"},
    url: { type: String, default: ""},
    strength: { type: String, enum: ['weak', 'medium', 'strong'], required: false },
    pin: { type: String, default: "" },
    pin_strength: { type: String, enum: ['weak', 'medium', 'strong'], required: false },
  },
  {
    timestamps: true, 
  }
);

export const VaultModel = mongoose.model<IVault>("Vault", VaultSchema);