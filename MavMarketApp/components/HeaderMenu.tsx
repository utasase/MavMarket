import React, { useState } from "react";
import { Menu } from "lucide-react-native";
import { SettingsPanel } from "./SettingsPanel";
import { useTheme } from "../lib/ThemeContext";
import { IconButton } from "./ui/IconButton";

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
      <IconButton
        icon={<Menu size={20} color={theme.colors.textPrimary} strokeWidth={1.75} />}
        onPress={() => setOpen(true)}
        accessibilityLabel="Open menu"
        size={40}
      />
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
