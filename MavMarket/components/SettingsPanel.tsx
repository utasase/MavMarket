import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Switch, Modal,
  Dimensions,
} from 'react-native';
import { X, ChevronRight, Bell, Shield, HelpCircle, Info, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';
import { ItemDetail } from './ItemDetail';
import { listings, type ListingItem } from '../constants/mockData';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedItemIds: string[];
  onToggleSave: (id: string) => void;
}

type ViewMode = 'main' | 'notifications' | 'saved';

export function SettingsPanel({ isOpen, onClose, savedItemIds, onToggleSave }: SettingsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);

  const savedItems = listings.filter((item) => savedItemIds.includes(item.id));

  const handleClose = () => {
    setViewMode('main');
    onClose();
  };

  if (selectedItem) {
    return (
      <Modal visible={isOpen} animationType="slide">
        <ItemDetail
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
          isSaved={savedItemIds.includes(selectedItem.id)}
          onToggleSave={() => onToggleSave(selectedItem.id)}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {viewMode === 'main' && (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings and Activity</Text>
              <Pressable onPress={handleClose} hitSlop={8}>
                <X size={22} color={Colors.black} strokeWidth={1.5} />
              </Pressable>
            </View>

            <View style={styles.menuSection}>
              <MenuItem
                icon={<Heart size={20} color={Colors.black} strokeWidth={1.5} />}
                label="Saved Listings"
                badge={`${savedItems.length}`}
                onPress={() => setViewMode('saved')}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SETTINGS</Text>
            </View>

            <View style={styles.menuSection}>
              <MenuItem
                icon={<Bell size={20} color={Colors.black} strokeWidth={1.5} />}
                label="Notifications"
                onPress={() => setViewMode('notifications')}
              />
              <MenuItem
                icon={<Shield size={20} color={Colors.black} strokeWidth={1.5} />}
                label="Privacy and Security"
                onPress={() => {}}
              />
              <MenuItem
                icon={<HelpCircle size={20} color={Colors.black} strokeWidth={1.5} />}
                label="Help and Support"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Info size={20} color={Colors.black} strokeWidth={1.5} />}
                label="About"
                onPress={() => {}}
              />
            </View>
          </>
        )}

        {viewMode === 'notifications' && (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setViewMode('main')} hitSlop={8}>
                <X size={22} color={Colors.black} strokeWidth={1.5} />
              </Pressable>
              <Text style={[styles.headerTitle, { marginLeft: 12 }]}>Notification Preferences</Text>
            </View>
            <View style={styles.notifContent}>
              <NotificationToggle label="New Messages" description="Get notified when you receive a message" />
              <NotificationToggle label="Price Drops" description="Alert when saved items go on sale" />
              <NotificationToggle label="New Listings" description="Notify about new items in your categories" />
              <NotificationToggle label="Item Sold" description="Alert when your listing sells" />
            </View>
          </>
        )}

        {viewMode === 'saved' && (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setViewMode('main')} hitSlop={8}>
                <X size={22} color={Colors.black} strokeWidth={1.5} />
              </Pressable>
              <Text style={[styles.headerTitle, { marginLeft: 12 }]}>Saved Listings</Text>
            </View>
            {savedItems.length === 0 ? (
              <View style={styles.empty}>
                <Heart size={32} color={Colors.gray300} />
                <Text style={styles.emptyTitle}>No saved items yet</Text>
                <Text style={styles.emptySubtitle}>Save items you love to view them here</Text>
              </View>
            ) : (
              <FlatList
                data={savedItems}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 1 }}
                columnWrapperStyle={{ gap: 1 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelectedItem(item)}
                    style={styles.gridItem}
                  >
                    <Image source={{ uri: item.image }} style={styles.gridImage} contentFit="cover" />
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>${item.price}</Text>
                    </View>
                    <View style={styles.gridInfo}>
                      <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.gridSeller}>
                        <Image source={{ uri: item.sellerAvatar }} style={styles.miniAvatar} />
                        <Text style={styles.gridSellerName}>{item.sellerName}</Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge && <Text style={styles.menuItemBadge}>{badge}</Text>}
        <ChevronRight size={18} color={Colors.gray400} />
      </View>
    </Pressable>
  );
}

function NotificationToggle({ label, description }: { label: string; description: string }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: Colors.gray200, true: Colors.utaBlue }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: { fontSize: 18, color: Colors.black, fontWeight: '600', flex: 1 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, color: Colors.gray500, letterSpacing: 1 },
  menuSection: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuItemLabel: { fontSize: 14, color: Colors.black },
  menuItemBadge: { fontSize: 12, color: Colors.gray400 },
  notifContent: { padding: 16, gap: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  toggleLabel: { fontSize: 14, color: Colors.black },
  toggleDesc: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 14, color: Colors.gray400 },
  emptySubtitle: { fontSize: 12, color: Colors.gray300, textAlign: 'center' },
  gridItem: { width: (SCREEN_WIDTH - 1) / 2, backgroundColor: Colors.white },
  gridImage: { aspectRatio: 1, width: '100%' },
  priceBadge: {
    position: 'absolute',
    bottom: 50,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: { color: Colors.white, fontSize: 12 },
  gridInfo: { padding: 10 },
  gridTitle: { fontSize: 14, color: Colors.gray900 },
  gridSeller: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  miniAvatar: { width: 16, height: 16, borderRadius: 8 },
  gridSellerName: { fontSize: 11, color: Colors.gray400 },
});
