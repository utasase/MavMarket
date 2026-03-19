import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login on first launch
  // After auth is implemented, check auth state here
  // and redirect to (tabs) if authenticated
  return <Redirect href="/(auth)/login" />;
}
