# Auth manual test cases

Use these to validate login, sign-up, session, and phone capture.

## 1. New user sign-up (email + password)

1. Open app → welcome (login) screen.
2. Tap **Sign up** → enter email, password, confirm password → **Continue**.
3. On **Add your phone number** → enter a phone (or tap **Skip for now**).
4. On **Your name** → enter first and last name → **Finish**.
5. **Expected:** Redirect to signup success / main app tabs. User is logged in.

## 2. Existing user login

1. From welcome screen tap **Sign in**.
2. Enter email and password → **Sign in**.
3. **Expected:** Redirect to Home tab. Session persists.

## 3. Session persistence

1. Log in (as in case 2).
2. Close the app fully and reopen (or reload in dev).
3. **Expected:** User remains logged in and lands on main app (tabs/home), not login.

## 4. Invalid credentials

1. On sign-in screen enter wrong email or password → **Sign in**.
2. **Expected:** Error message (e.g. "Invalid email or password" or Supabase message). No redirect.

## 5. Forgot password

1. On sign-in screen tap **Forgot password?**.
2. Enter email → **Send reset link**.
3. **Expected:** Success message; option to go back to sign in. (Check email for reset link if Supabase email is configured.)

## 6. Add / update phone (logged-in user, not enforced)

1. Log in → open **Home** tab.
2. Tap **Add phone number**.
3. Select country, enter number → **Save number** (or **Skip for now**).
4. **Expected:** Return to Home. If saved, profile has phone and `phone_verified = false`. No feature is blocked if user skips.

## 7. Sign-up with phone then skip

1. Sign up → on **Add your phone number** tap **Skip for now**.
2. Complete **Your name** → **Finish**.
3. **Expected:** Account created and logged in; profile has no phone (or null). No blocking.

## Future

- When SMS verification is enabled: add test for “Enter code” flow and `phone_verified` update.
- Optional: E2E tests (e.g. Detox) for the above flows.
