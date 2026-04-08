import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Menu } from "lucide-react-native";
import { SettingsPanel } from "./SettingsPanel";
import { useTheme } from "../lib/ThemeContext";

interface HeaderMenuProps {
  isAdmin?: boolean;
  onAdminPress?: () => void;
  savedItemIds?: string[];
  onToggleSave?: (id: string) => void;
}

export function HeaderMenu({
  isAdmin = false,
  onAdminPress,
  savedItemIds,
  onToggleSave,
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ padding: 6 }}>
        <Menu size={22} color={theme.colors.textPrimary} strokeWidth={1.5} />
      </TouchableOpacity>
      <SettingsPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        isAdmin={isAdmin}
        onAdminPress={onAdminPress}
        savedItemIds={savedItemIds}
        onToggleSave={onToggleSave}
      />
    </>
  );
}
