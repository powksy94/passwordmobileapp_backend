export interface ValidatedPinItem {
  type: 'pin';
  title: string;
  pin: string;
  notes: string;
  pin_strength?: 'weak' | 'medium' | 'strong';
}

export type PinValidationResult =
  | { valid: true; item: ValidatedPinItem }
  | { valid: false; message: string };

export const validatePinItem = (body: Record<string, unknown>): PinValidationResult => {
  const { title, pin, notes, pin_strength } = body as {
    title?: string;
    pin?: string;
    notes?: string;
    pin_strength?: string;
  };

  if (!title) return { valid: false, message: "Title is required." };
  if (!pin) return { valid: false, message: "Pin is required." };
  if (pin_strength !== undefined && !['weak', 'medium', 'strong'].includes(pin_strength)) {
    return { valid: false, message: "Invalid pin_strength value." };
  }

  return {
    valid: true,
    item: {
      type: 'pin',
      title,
      pin,
      notes: notes ?? "",
      pin_strength: pin_strength as 'weak' | 'medium' | 'strong' | undefined,
    },
  };
};
