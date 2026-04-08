import React, { useState, useRef, useEffect } from "react";
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

import { X, ChevronRight, Bell, Shield, HelpCircle, Info, Heart, LogOut, Moon, Sun } from "lucide-react-native";
import { type ListingItem } from "../data/mockData";
import { ItemDetail } from "./ItemDetail";
import { useAuth } from "../lib/auth-context";
import { getNotificationPreferences, updateNotificationPreferences } from "../lib/profile";
import { getListingsByIds } from "../lib/listings";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

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

export function SettingsPanel({ isOpen, onClose, savedItemIds = [], onToggleSave, onAdminPress, isAdmin = false }: SettingsPanelProps) {
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
  const { user } = useAuth();

  const styles = makeStyles(c);

  // Animation only — isolated so data loading never interrupts the slide.
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
  }, [isOpen]);

  // Data loading — runs once when the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      getNotificationPreferences(user.id)
        .then((prefs) => {
          if (Object.keys(prefs).length > 0) setNotifPrefs((prev) => ({ ...prev, ...prefs }));
        })
        .catch(() => {});
    }
    getListingsByIds(savedItemIds)
      .then(setSavedItems)
      .catch(() => setSavedItems([]));
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
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Panel */}
      <Animated.View
        style={[styles.panel, { paddingTop: insets.top, transform: [{ translateX: slideX }], backgroundColor: c.background }]}
      >
        {viewMode === "main" && (
          <>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Settings and Activity</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={22} color={c.textPrimary} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Saved */}
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setViewMode("saved")}
                  style={styles.menuRow}
                >
                  <View style={styles.menuRowLeft}>
                    <Heart size={20} color={c.textPrimary} strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>Saved Listings</Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    <Text style={styles.menuCount}>{savedItems.length}</Text>
                    <ChevronRight size={18} color={c.textTertiary} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Settings section */}
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeader}>SETTINGS</Text>
              </View>
              <View style={styles.section}>
                {/* Dark mode toggle */}
                <TouchableOpacity onPress={toggleTheme} style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    {isDark ? <Sun size={20} color={c.textPrimary} strokeWidth={1.5} /> : <Moon size={20} color={c.textPrimary} strokeWidth={1.5} />}
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>{isDark ? "Light Mode" : "Dark Mode"}</Text>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#D1D5DB", true: c.accent }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("notifications")}
                  style={styles.menuRow}
                >
                  <View style={styles.menuRowLeft}>
                    <Bell size={20} color={c.textPrimary} strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>Notifications</Text>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <Shield size={20} color={c.textPrimary} strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>Privacy and Security</Text>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <HelpCircle size={20} color={c.textPrimary} strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>Help and Support</Text>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <Info size={20} color={c.textPrimary} strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: c.textPrimary }]}>About</Text>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </TouchableOpacity>
              </View>

              {/* Admin row — only visible to admins */}
              {isAdmin && onAdminPress && (
                <>
                  <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>ADMIN</Text>
                  </View>
                  <View style={styles.section}>
                    <TouchableOpacity onPress={() => { handleClose(); onAdminPress(); }} style={styles.menuRow}>
                      <View style={styles.menuRowLeft}>
                        <Shield size={20} color="#DC2626" strokeWidth={1.5} />
                        <Text style={[styles.menuLabel, { color: "#DC2626" }]}>Moderation Queue</Text>
                      </View>
                      <ChevronRight size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Sign Out */}
              <View style={styles.sectionHeaderContainer} />
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() },
                    ]);
                  }}
                  style={styles.menuRow}
                >
                  <View style={styles.menuRowLeft}>
                    <LogOut size={20} color="#EF4444" strokeWidth={1.5} />
                    <Text style={[styles.menuLabel, { color: "#EF4444" }]}>Sign Out</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}

        {viewMode === "notifications" && (
          <>
            <View style={[styles.panelHeader, { backgroundColor: c.background }]}>
              <TouchableOpacity onPress={() => setViewMode("main")} style={styles.closeBtn}>
                <X size={22} color={c.textPrimary} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.panelTitle}>Notification Preferences</Text>
            </View>
            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              <NotificationToggle
                label="New Messages"
                description="Get notified when you receive a message"
                value={notifPrefs.new_messages ?? true}
                onChange={(v) => handleNotifToggle("new_messages", v)}
                c={c}
              />
              <NotificationToggle
                label="Price Drops"
                description="Alert when saved items go on sale"
                value={notifPrefs.price_drops ?? true}
                onChange={(v) => handleNotifToggle("price_drops", v)}
                c={c}
              />
              <NotificationToggle
                label="New Listings"
                description="Notify about new items in your categories"
                value={notifPrefs.new_listings ?? true}
                onChange={(v) => handleNotifToggle("new_listings", v)}
                c={c}
              />
              <NotificationToggle
                label="Item Sold"
                description="Alert when your listing sells"
                value={notifPrefs.item_sold ?? true}
                onChange={(v) => handleNotifToggle("item_sold", v)}
                c={c}
              />
            </ScrollView>
          </>
        )}

        {viewMode === "saved" && (
          <>
            <View style={styles.panelHeader}>
              <TouchableOpacity onPress={() => setViewMode("main")} style={styles.closeBtn}>
                <X size={22} color={c.textPrimary} strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.panelTitle}>Saved Listings</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {savedItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Heart size={32} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyText}>No saved items yet</Text>
                  <Text style={styles.emptySubtext}>Save items you love to view them here</Text>
                </View>
              ) : (
                <View style={styles.savedGrid}>
                  {savedItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedItem(item)}
                      style={styles.gridItem}
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
                        <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.gridSeller}>
                          <Image
                            source={{ uri: item.sellerAvatar }}
                            style={styles.gridSellerAvatar}
                          />
                          <Text style={styles.gridSellerName}>{item.sellerName}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* Item detail overlay inside panel */}
        {selectedItem && (
          <View style={StyleSheet.absoluteFillObject}>
            <ItemDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              isSaved={savedItemIds.includes(selectedItem.id)}
              onToggleSave={() => onToggleSave(selectedItem.id)}
            />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

function NotificationToggle({
  label,
  description,
  value,
  onChange,
  c,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  c: any;
}) {
  const notifStyles = makeNotifStyles(c);
  return (
    <View style={notifStyles.row}>
      <View style={notifStyles.textBlock}>
        <Text style={notifStyles.label}>{label}</Text>
        <Text style={notifStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D1D5DB", true: c.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const ITEM_WIDTH = (width) / 2 - 1;

const makeStyles = (c: any) => StyleSheet.create({
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
    backgroundColor: c.background,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  panelTitle: {
    fontSize: 18,
    color: c.textPrimary,
  },
  closeBtn: {
    padding: 8,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuLabel: {
    fontSize: 14,
    color: c.textPrimary,
  },
  menuCount: {
    fontSize: 12,
    color: c.textTertiary,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    color: c.textSecondary,
    letterSpacing: 0.5,
  },
  notifList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    height: 192,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: c.textTertiary,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#D1D5DB",
    textAlign: "center",
  },
  savedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
    backgroundColor: c.borderLight,
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
    bottom: 48,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  gridCaption: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 14,
    color: c.textPrimary,
  },
  gridSeller: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  gridSellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  gridSellerName: {
    fontSize: 11,
    color: c.textTertiary,
  },
});

const makeNotifStyles = (c: any) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.surface,
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    color: c.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: c.textTertiary,
    marginTop: 2,
  },
});
