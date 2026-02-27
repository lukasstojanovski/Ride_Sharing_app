import { Redirect } from 'expo-router';

// _layout.tsx handles all the session logic and redirects.
// This file just provides a fallback default route.
export default function Index() {
  return <Redirect href="/login" />;
}
