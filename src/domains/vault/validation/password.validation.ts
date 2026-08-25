export interface ValidatedPasswordItem {
  type: 'password';
  title: string;
  login: string;
  password: string;
  notes: string;
  icon: string;
  url: string;
  strength?: 'weak' | 'medium' | 'strong';
}

export type PasswordValidationResult =
  | { valid: true; item: ValidatedPasswordItem }
  | { valid: false; message: string };

export const validatePasswordItem = (body: Record<string, unknown>): PasswordValidationResult => {
  const { title, login, password, notes, icon, url, strength } = body as {
    title?: string;
    login?: string;
    password?: string;
    notes?: string;
    icon?: string;
    url?: string;
    strength?: string;
  };

  if (!title) return { valid: false, message: "Title is required." };
  if (!password) return { valid: false, message: "Password is required." };
  if (strength !== undefined && !['weak', 'medium', 'strong'].includes(strength)) {
    return { valid: false, message: "Invalid strength value." };
  }

  return {
    valid: true,
    item: {
      type: 'password',
      title,
      login: login ?? "",
      password,
      notes: notes ?? "",
      icon: icon ?? "lock",
      url: url ?? "",
      strength: strength as 'weak' | 'medium' | 'strong' | undefined,
    },
  };
};
