// Dummy screen — the tab press is intercepted in _layout.tsx to show CreateListingModal.
// This file must exist so Expo Router registers the route.
import { View } from "react-native";
export default function CreateScreen() {
  return <View />;
}
