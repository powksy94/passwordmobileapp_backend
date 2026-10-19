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
  // Weak/medium reminder episode tracking (see upgrade/WEAK_ITEM_PUSH_REMINDERS.md):
  // set as soon as strength/pin_strength is 'weak' or 'medium', independently of
  // any user's reminder preferences, which only apply when the job reads this.
  weakSince?: Date | null;
  weakReminderStage?: 0 | 1 | 2 | 3;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema<IVault>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['password', 'pin'], default: 'password' },
    title: { type: String, required: true },
    login: { type: String, default: ""},
    // Not required: an item of type 'pin' does not fill this field (it uses `pin` instead).
    password: { type: String, default: ""},
    notes: { type: String, default: ""},
    icon: { type: String, default: "lock"},
    url: { type: String, default: ""},
    strength: { type: String, enum: ['weak', 'medium', 'strong'], required: false },
    pin: { type: String, default: "" },
    pin_strength: { type: String, enum: ['weak', 'medium', 'strong'], required: false },
    weakSince: { type: Date, default: null },
    weakReminderStage: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  },
  {
    timestamps: true, 
  }
);

export const VaultModel = mongoose.model<IVault>("Vault", VaultSchema);