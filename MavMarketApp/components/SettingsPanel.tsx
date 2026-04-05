import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
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

import { X, ChevronRight, Bell, Shield, HelpCircle, Info, Heart } from "lucide-react-native";
import { type ListingItem } from "../data/mockData";
import { ItemDetail } from "./ItemDetail";
import { useAuth } from "../lib/auth-context";
import { getNotificationPreferences, updateNotificationPreferences } from "../lib/profile";
import { getListingsByIds } from "../lib/listings";

const { width } = Dimensions.get("window");

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItemIds: string[];
  onToggleSave: (id: string) => void;
}

type ViewMode = "main" | "notifications" | "saved";

export function SettingsPanel({ isOpen, onClose, savedItemIds, onToggleSave }: SettingsPanelProps) {
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

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideX, { toValue: 0, damping: 30, stiffness: 300, useNativeDriver: true }).start();
      if (user) {
        getNotificationPreferences(user.id)
          .then((prefs) => {
            if (Object.keys(prefs).length > 0) setNotifPrefs((prev) => ({ ...prev, ...prefs }));
          })
          .catch(() => {});
      }
      // Fetch live data for saved listing IDs from the DB.
      getListingsByIds(savedItemIds)
        .then(setSavedItems)
        .catch(() => setSavedItems([]));
    } else {
      slideX.setValue(width);
    }
  }, [isOpen, user, savedItemIds]);

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
        style={[styles.panel, { paddingTop: insets.top, transform: [{ translateX: slideX }] }]}
      >
        {viewMode === "main" && (
          <>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Settings and Activity</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={22} color="#111827" strokeWidth={1.5} />
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
                    <Heart size={20} color="#111827" strokeWidth={1.5} />
                    <Text style={styles.menuLabel}>Saved Listings</Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    <Text style={styles.menuCount}>{savedItems.length}</Text>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Settings section */}
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeader}>SETTINGS</Text>
              </View>
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setViewMode("notifications")}
                  style={styles.menuRow}
                >
                  <View style={styles.menuRowLeft}>
                    <Bell size={20} color="#111827" strokeWidth={1.5} />
                    <Text style={styles.menuLabel}>Notifications</Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <Shield size={20} color="#111827" strokeWidth={1.5} />
                    <Text style={styles.menuLabel}>Privacy and Security</Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <HelpCircle size={20} color="#111827" strokeWidth={1.5} />
                    <Text style={styles.menuLabel}>Help and Support</Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow}>
                  <View style={styles.menuRowLeft}>
                    <Info size={20} color="#111827" strokeWidth={1.5} />
                    <Text style={styles.menuLabel}>About</Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}

        {viewMode === "notifications" && (
          <>
            <View style={styles.panelHeader}>
              <TouchableOpacity onPress={() => setViewMode("main")} style={styles.closeBtn}>
                <X size={22} color="#111827" strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.panelTitle}>Notification Preferences</Text>
            </View>
            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              <NotificationToggle
                label="New Messages"
                description="Get notified when you receive a message"
                value={notifPrefs.new_messages ?? true}
                onChange={(v) => handleNotifToggle("new_messages", v)}
              />
              <NotificationToggle
                label="Price Drops"
                description="Alert when saved items go on sale"
                value={notifPrefs.price_drops ?? true}
                onChange={(v) => handleNotifToggle("price_drops", v)}
              />
              <NotificationToggle
                label="New Listings"
                description="Notify about new items in your categories"
                value={notifPrefs.new_listings ?? true}
                onChange={(v) => handleNotifToggle("new_listings", v)}
              />
              <NotificationToggle
                label="Item Sold"
                description="Alert when your listing sells"
                value={notifPrefs.item_sold ?? true}
                onChange={(v) => handleNotifToggle("item_sold", v)}
              />
            </ScrollView>
          </>
        )}

        {viewMode === "saved" && (
          <>
            <View style={styles.panelHeader}>
              <TouchableOpacity onPress={() => setViewMode("main")} style={styles.closeBtn}>
                <X size={22} color="#111827" strokeWidth={1.5} />
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
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={notifStyles.row}>
      <View style={notifStyles.textBlock}>
        <Text style={notifStyles.label}>{label}</Text>
        <Text style={notifStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D1D5DB", true: "#0064B1" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const ITEM_WIDTH = (width) / 2 - 1;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: width,
    backgroundColor: "#FFFFFF",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  panelTitle: {
    fontSize: 18,
    color: "#111827",
  },
  closeBtn: {
    padding: 8,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    color: "#111827",
  },
  menuCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    color: "#6B7280",
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
    color: "#9CA3AF",
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
    backgroundColor: "#F3F4F6",
  },
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
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
    color: "#9CA3AF",
  },
});

const notifStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    color: "#111827",
  },
  desc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
});
