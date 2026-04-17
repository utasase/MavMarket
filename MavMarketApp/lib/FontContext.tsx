import React, { createContext, useContext } from "react";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

type FontContextValue = {
  loaded: boolean;
};

const FontContext = createContext<FontContextValue>({ loaded: false });

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <FontContext.Provider value={{ loaded }}>{children}</FontContext.Provider>
  );
}

export function useFontsLoaded(): boolean {
  return useContext(FontContext).loaded;
}
