import type { Translations } from "./i18n/translations";

type ShowAlert = (title: string, message: string) => void;

type ProfileStrings = Translations["profile"];

/**
 * Placeholder until email-verified phone change is implemented.
 * Future: invoke edge function → email link → change-phone screen → update profiles.phone + phone_verified
 */
export function requestPhoneNumberChange(
  showAlert: ShowAlert,
  t: ProfileStrings
): void {
  showAlert(t.phoneChangeTitle, t.phoneChangeMessage);
}
