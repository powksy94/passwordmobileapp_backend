// Push text for the weak/medium item reminder, in the app's 3 supported
// locales (see supportedLocales in main.dart) - kept in sync by hand with
// the app's own wording (titleWeakReminders and friends in the ARB files),
// since the server cannot import Flutter's generated localizations.
export type SupportedLocale = 'en' | 'fr' | 'es';

interface WeakReminderText {
  title: string;
  body: (count: number) => string;
}

export const WEAK_REMINDER_MESSAGES: Record<SupportedLocale, WeakReminderText> = {
  fr: {
    title: 'Rappel de sécurité',
    body: (count) => `Vous avez ${count} mot${count > 1 ? 's' : ''} de passe/PIN à renforcer.`,
  },
  en: {
    title: 'Security reminder',
    body: (count) => `You have ${count} password${count > 1 ? 's' : ''}/PIN${count > 1 ? 's' : ''} to strengthen.`,
  },
  es: {
    title: 'Recordatorio de seguridad',
    body: (count) => `Tienes ${count} contraseña${count > 1 ? 's' : ''}/PIN que reforzar.`,
  },
};
