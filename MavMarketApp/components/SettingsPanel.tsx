import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Info,
  Heart,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
} from "lucide-react-native";
import { type ListingItem, type Theme } from "../lib/types";
import { ItemDetail } from "./ItemDetail";
import { useAuth } from "../lib/auth-context";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../lib/profile";
import { getListingsByIds } from "../lib/listings";
import { useTheme } from "../lib/ThemeContext";
import { EmptyState } from "./ui/EmptyState";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";

const { width } = Dimensions.get("window");

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItemIds?: string[];
  onToggleSave?: (id: string) => void;
  onAdminPress?: () => void;
  isAdmin?: boolean;
}

type ViewMode = "main" | "notifications" | "saved";

export function SettingsPanel({
  isOpen,
  onClose,
  savedItemIds = [],
  onToggleSave,
  onAdminPress,
  isAdmin = false,
}: SettingsPanelProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const c = theme.colors;
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<ListingItem[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    new_messages: true,
    price_drops: true,
    new_listings: true,
    item_sold: true,
  });
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(width)).current;
  const { user, logout } = useAuth();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    if (isOpen) {
      Animated.timing(slideX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      slideX.setValue(width);
    }
  }, [isOpen, slideX]);

  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      getNotificationPreferences(user.id)
        .then((prefs) => {
          if (Object.keys(prefs).length > 0)
            setNotifPrefs((prev) => ({ ...prev, ...prefs }));
        })
        .catch(() => {});
    }
    getListingsByIds(savedItemIds)
      .then(setSavedItems)
      .catch(() => setSavedItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const handleNotifToggle = (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    if (user) updateNotificationPreferences(user.id, updated).catch(() => {});
  };

  const handleClose = () => {
    setViewMode("main");
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.panel,
          {
            paddingTop: insets.top,
            transform: [{ translateX: slideX }],
            backgroundColor: c.background,
          },
        ]}
      >
        {viewMode === "main" ? (
          <>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Settings</Text>
              <IconButton
                icon={<X size={20} color={c.textPrimary} strokeWidth={1.85} />}
                onPress={handleClose}
                accessibilityLabel="Close settings"
                size={40}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <SectionLabel label="Activity" theme={theme} />
              <View style={styles.section}>
                <MenuRow
                  icon={<Heart size={18} color={c.textPrimary} strokeWidth={1.85} />}
                  label="Saved listings"
                  onPress={() => setViewMode("saved")}
                  rightContent={
                    <View style={styles.rightRow}>
                      <Text style={styles.countText}>{savedItems.length}</Text>
                      <ChevronRight size={16} color={c.textTertiary} />
                    </View>
                  }
                  theme={theme}
                />
              </View>

              <SectionLabel label="Preferences" theme={theme} />
              <View style={styles.section}>
                <MenuRow
                  icon={
                    isDark ? (
                      <Sun size={18} color={c.textPrimary} strokeWidth={1.85} />
                    ) : (
                      <Moon size={18} color={c.textPrimary} strokeWidth={1.85} />
                    )
                  }
                  label={isDark ? "Light mode" : "Dark mode"}
                  onPress={toggleTheme}
                  rightContent={
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{ false: c.border, true: c.accent500 }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={c.border}
                    />
                  }
                  theme={theme}
                />
                <MenuRow
                  icon={<Bell size={18} color={c.textPrimary} strokeWidth={1.85} />}
                  label="Notifications"
                  onPress={() => setViewMode("notifications")}
                  rightContent={
                    <ChevronRight size={16} color={c.textTertiary} />
                  }
                  theme={theme}
                />
                <MenuRow
                  icon={<Shield size={18} color={c.textPrimary} strokeWidth={1.85} />}
                  label="Privacy and security"
                  onPress={() => {}}
                  rightContent={
                    <ChevronRight size={16} color={c.textTertiary} />
                  }
                  theme={theme}
                />
                <MenuRow
                  icon={<HelpCircle size={18} color={c.textPrimary} strokeWidth={1.85} />}
                  label="Help and support"
                  onPress={() => {}}
                  rightContent={
                    <ChevronRight size={16} color={c.textTertiary} />
                  }
                  theme={theme}
                />
                <MenuRow
                  icon={<Info size={18} color={c.textPrimary} strokeWidth={1.85} />}
                  label="About Mav Market"
                  onPress={() => {}}
                  rightContent={
                    <ChevronRight size={16} color={c.textTertiary} />
                  }
                  theme={theme}
                />
              </View>

              {isAdmin && onAdminPress ? (
                <>
                  <SectionLabel label="Admin" theme={theme} />
                  <View style={styles.section}>
                    <MenuRow
                      icon={
                        <Shield size={18} color={c.error} strokeWidth={1.85} />
                      }
                      label="Moderation queue"
                      labelColor={c.error}
                      onPress={() => {
                        handleClose();
                        onAdminPress();
                      }}
                      rightContent={
                        <ChevronRight size={16} color={c.error} />
                      }
                      theme={theme}
                    />
                  </View>
                </>
              ) : null}

              <SectionLabel label="" theme={theme} />
              <View style={styles.section}>
                <MenuRow
                  icon={<LogOut size={18} color={c.error} strokeWidth={1.85} />}
                  label="Sign out"
                  labelColor={c.error}
                  onPress={() => {
                    Alert.alert(
                      "Sign Out",
                      "Are you sure you want to sign out?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Sign Out",
                          style: "destructive",
                          onPress: () => logout(),
                        },
                      ]
                    );
                  }}
                  theme={theme}
                />
              </View>
              <View style={{ height: spacing.xxxl }} />
            </ScrollView>
          </>
        ) : null}

        {viewMode === "notifications" ? (
          <>
            <View style={styles.panelHeader}>
              <IconButton
                icon={
                  <ChevronLeft
                    size={20}
                    color={c.textPrimary}
                    strokeWidth={1.85}
                  />
                }
                onPress={() => setViewMode("main")}
                accessibilityLabel="Back"
                size={40}
              />
              <Text style={styles.panelTitle}>Notifications</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              <NotificationToggle
                label="New messages"
                description="Get notified when you receive a new message."
                value={notifPrefs.new_messages ?? true}
                onChange={(v) => handleNotifToggle("new_messages", v)}
                theme={theme}
              />
              <NotificationToggle
                label="Price drops"
                description="Alerts when items you've saved go on sale."
                value={notifPrefs.price_drops ?? true}
                onChange={(v) => handleNotifToggle("price_drops", v)}
                theme={theme}
              />
              <NotificationToggle
                label="New listings"
                description="Hear about new items in the categories you follow."
                value={notifPrefs.new_listings ?? true}
                onChange={(v) => handleNotifToggle("new_listings", v)}
                theme={theme}
              />
              <NotificationToggle
                label="Item sold"
                description="Know when one of your listings sells."
                value={notifPrefs.item_sold ?? true}
                onChange={(v) => handleNotifToggle("item_sold", v)}
                theme={theme}
              />
            </ScrollView>
          </>
        ) : null}

        {viewMode === "saved" ? (
          <>
            <View style={styles.panelHeader}>
              <IconButton
                icon={
                  <ChevronLeft
                    size={20}
                    color={c.textPrimary}
                    strokeWidth={1.85}
                  />
                }
                onPress={() => setViewMode("main")}
                accessibilityLabel="Back"
                size={40}
              />
              <Text style={styles.panelTitle}>Saved</Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {savedItems.length === 0 ? (
                <EmptyState
                  icon={<Heart size={22} color={c.textTertiary} />}
                  title="Nothing saved yet"
                  description="Tap the heart on a listing to save it for later."
                />
              ) : (
                <View style={styles.savedGrid}>
                  {savedItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedItem(item)}
                      style={styles.gridItem}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>${item.price}</Text>
                      </View>
                      <View style={styles.gridCaption}>
                        <Text style={styles.gridTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.gridSellerName} numberOfLines={1}>
                          {item.sellerName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </>
        ) : null}

        {selectedItem ? (
          <View style={StyleSheet.absoluteFillObject}>
            <ItemDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              isSaved={savedItemIds.includes(selectedItem.id)}
              onToggleSave={() => onToggleSave?.(selectedItem.id)}
            />
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function SectionLabel({
  label,
  theme,
}: {
  label: string;
  theme: Theme;
}) {
  if (!label) {
    return <View style={{ paddingTop: spacing.lg }} />;
  }
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
      <Text
        style={{
          color: theme.colors.textTertiary,
          fontFamily: theme.typography.overline.fontFamily,
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  labelColor,
  onPress,
  rightContent,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onPress: () => void;
  rightContent?: React.ReactNode;
  theme: Theme;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.hairline,
        minHeight: 52,
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={{ width: 28, alignItems: "center" }}>{icon}</View>
      <Text
        style={{
          flex: 1,
          marginLeft: spacing.md,
          color: labelColor ?? theme.colors.textPrimary,
          fontFamily: theme.typography.body.fontFamily,
          fontSize: 15,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      {rightContent}
    </TouchableOpacity>
  );
}

function NotificationToggle({
  label,
  description,
  value,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: Theme;
}) {
  const c = theme.colors;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.hairline,
      }}
    >
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text
          style={{
            color: c.textPrimary,
            fontFamily: theme.typography.bodyStrong.fontFamily,
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: c.textTertiary,
            fontFamily: theme.typography.caption.fontFamily,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: c.accent500 }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={c.border}
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  const ITEM_WIDTH = width / 2 - 1;
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    panel: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: width,
    },
    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    panelTitle: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    section: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.hairline,
    },
    rightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    countText: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
    },
    savedGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 1,
      backgroundColor: c.hairline,
    },
    gridItem: {
      width: ITEM_WIDTH,
      backgroundColor: c.background,
    },
    gridImage: {
      width: ITEM_WIDTH,
      height: ITEM_WIDTH,
    },
    priceBadge: {
      position: "absolute",
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    priceBadgeText: {
      color: "#FFFFFF",
      fontFamily: t.label.fontFamily,
      fontSize: 11,
      fontWeight: "700",
    },
    gridCaption: {
      padding: spacing.md,
    },
    gridTitle: {
      color: c.textPrimary,
      fontFamily: t.body.fontFamily,
      fontSize: 13,
      fontWeight: "600",
    },
    gridSellerName: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
      marginTop: 2,
    },
  });
}
