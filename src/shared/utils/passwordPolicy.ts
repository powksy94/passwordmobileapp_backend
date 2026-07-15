const MIN_LENGTH = 12;

const hasLower   = (v: string) => /[a-z]/.test(v);
const hasUpper   = (v: string) => /[A-Z]/.test(v);
const hasDigit   = (v: string) => /[0-9]/.test(v);
const hasSpecial = (v: string) => /[^a-zA-Z0-9]/.test(v);

// Server-side mirror of the Flutter PasswordPolicy: defense in depth for the
// account password, which is the only one ever sent to the backend (the
// master password is derived and used client-side only, never transmitted).
export const isValidAccountPassword = (v: string): boolean =>
  typeof v === "string" &&
  v.length >= MIN_LENGTH &&
  hasLower(v) && hasUpper(v) && hasDigit(v) && hasSpecial(v);

export const PASSWORD_POLICY_ERROR =
  `Password must be at least ${MIN_LENGTH} characters and include an uppercase letter, a lowercase letter, a digit and a special character`;
