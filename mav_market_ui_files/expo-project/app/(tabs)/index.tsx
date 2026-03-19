import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, FlatList,
  Dimensions, Modal, ScrollView,
} from 'react-native';
import { Search, SlidersHorizontal, X, Heart, Menu } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listings, categories, type ListingItem } from '../../constants/mockData';
import { MavLogo } from '../../components/MavLogo';
import { ItemDetail } from '../../components/ItemDetail';
import { SettingsPanel } from '../../components/SettingsPanel';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 1) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPrice = item.price <= maxPrice;
    const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
  });

  const toggleSave = useCallback((id: string) => {
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const renderItem = useCallback(({ item }: { item: ListingItem }) => (
    <Pressable onPress={() => setSelectedItem(item)} style={styles.gridItem}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.gridImage} contentFit="cover" />
        <Pressable
          onPress={() => toggleSave(item.id)}
          style={styles.heartBtn}
          hitSlop={8}
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            color={savedItems.includes(item.id) ? Colors.red500 : Colors.white}
            fill={savedItems.includes(item.id) ? Colors.red500 : 'transparent'}
          />
        </Pressable>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.sellerRow}>
          <Image source={{ uri: item.sellerAvatar }} style={styles.miniAvatar} />
          <Text style={styles.sellerName}>{item.sellerName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.postedAt}>{item.postedAt}</Text>
        </View>
      </View>
    </Pressable>
  ), [savedItems, toggleSave]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MavLogo size={28} />
          <Text style={styles.appTitle}>Mav Market</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowSearch(!showSearch)} style={styles.iconBtn}>
            <Search size={22} color={Colors.black} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={styles.iconBtn}
          >
            <SlidersHorizontal
              size={22}
              color={showFilters ? Colors.utaBlue : Colors.black}
              strokeWidth={1.5}
            />
          </Pressable>
          <Pressable onPress={() => setShowSettings(true)} style={styles.iconBtn}>
            <Menu size={22} color={Colors.black} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <View style={styles.searchWrapper}>
            <Search size={16} color={Colors.gray400} />
            <TextInput
              placeholder="Search..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoFocus
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={16} color={Colors.gray400} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Max Price: ${maxPrice}</Text>
            <Slider
              minimumValue={0}
              maximumValue={1000}
              step={10}
              value={maxPrice}
              onValueChange={setMaxPrice}
              minimumTrackTintColor={Colors.black}
              maximumTrackTintColor={Colors.gray200}
              thumbTintColor={Colors.black}
            />
            <Text style={[styles.filterLabel, { marginTop: 8 }]}>Condition</Text>
            <View style={styles.conditionRow}>
              {['All', 'Like New', 'Good', 'Fair'].map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setSelectedCondition(c)}
                  style={[
                    styles.conditionChip,
                    selectedCondition === c && styles.conditionChipActive,
                  ]}
                >
                  <Text style={[
                    styles.conditionChipText,
                    selectedCondition === c && styles.conditionChipTextActive,
                  ]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat && styles.categoryChipTextActive,
            ]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Listings Grid */}
      <FlatList
        data={filteredListings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={{ gap: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Search size={32} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Item Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="fullScreen">
        {selectedItem && (
          <ItemDetail
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            isSaved={savedItems.includes(selectedItem.id)}
            onToggleSave={() => toggleSave(selectedItem.id)}
          />
        )}
      </Modal>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        savedItemIds={savedItems}
        onToggleSave={toggleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appTitle: { fontSize: 20, color: Colors.black, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.gray50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.black },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  filterLabel: { fontSize: 12, color: Colors.gray500, marginBottom: 6 },
  conditionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  conditionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
  },
  conditionChipActive: { backgroundColor: Colors.black },
  conditionChipText: { fontSize: 12, color: Colors.gray600 },
  conditionChipTextActive: { color: Colors.white },
  categoryScroll: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  categoryChipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  categoryChipText: { fontSize: 12, color: Colors.gray500 },
  categoryChipTextActive: { color: Colors.white },
  gridContainer: { backgroundColor: Colors.gray100 },
  gridItem: { width: ITEM_WIDTH, backgroundColor: Colors.white },
  imageContainer: { aspectRatio: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 8, right: 8, padding: 6 },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: { color: Colors.white, fontSize: 12 },
  gridInfo: { padding: 10 },
  gridTitle: { fontSize: 14, color: Colors.gray900 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  miniAvatar: { width: 16, height: 16, borderRadius: 8 },
  sellerName: { fontSize: 11, color: Colors.gray400 },
  dot: { fontSize: 11, color: Colors.gray300 },
  postedAt: { fontSize: 11, color: Colors.gray400 },
  empty: { justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 14, color: Colors.gray400 },
  emptySubtitle: { fontSize: 12, color: Colors.gray300 },
});
