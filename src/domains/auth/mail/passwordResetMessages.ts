// Password reset email, in the app's 3 supported locales (users.locale,
// sent by the app alongside its FCM token).
export type SupportedLocale = "en" | "fr" | "es";

interface PasswordResetText {
  subject: string;
  intro: string;
  validity: (minutes: number) => string;
  ignore: string;
  vaultNote: string;
}

export const PASSWORD_RESET_MESSAGES: Record<SupportedLocale, PasswordResetText> = {
  fr: {
    subject: "Votre code de réinitialisation",
    intro: "Voici votre code pour réinitialiser le mot de passe de connexion de votre compte :",
    validity: (m) => `Ce code est valable ${m} minutes.`,
    ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe ne change pas.",
    vaultNote: "Ce code réinitialise uniquement le mot de passe de connexion. Votre coffre reste protégé par votre mot de passe maître, qui n'est pas concerné.",
  },
  en: {
    subject: "Your reset code",
    intro: "Here is your code to reset your account login password:",
    validity: (m) => `This code is valid for ${m} minutes.`,
    ignore: "If you did not request this, ignore this email: your password stays the same.",
    vaultNote: "This code only resets your login password. Your vault stays protected by your master password, which is not affected.",
  },
  es: {
    subject: "Tu código de restablecimiento",
    intro: "Este es tu código para restablecer la contraseña de inicio de sesión de tu cuenta:",
    validity: (m) => `Este código es válido durante ${m} minutos.`,
    ignore: "Si no has solicitado esto, ignora este correo: tu contraseña no cambia.",
    vaultNote: "Este código solo restablece tu contraseña de inicio de sesión. Tu bóveda sigue protegida por tu contraseña maestra, que no se ve afectada.",
  },
};

export const buildPasswordResetEmail = (
  locale: string,
  code: string,
  validityMinutes: number
): { subject: string; text: string; html: string } => {
  const t = PASSWORD_RESET_MESSAGES[locale as SupportedLocale] ?? PASSWORD_RESET_MESSAGES.en;
  const text = [t.intro, "", code, "", t.validity(validityMinutes), "", t.ignore, t.vaultNote].join("\n");
  const html = `
    <p>${t.intro}</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:6px;font-family:monospace">${code}</p>
    <p>${t.validity(validityMinutes)}</p>
    <p style="color:#666">${t.ignore}</p>
    <p style="color:#666">${t.vaultNote}</p>`;
  return { subject: t.subject, text, html };
};
