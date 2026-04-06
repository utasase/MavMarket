import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, SlidersHorizontal, X, Heart, Menu } from "lucide-react-native";
import { listings as mockListings, categories, type ListingItem } from "../data/mockData";
import { MavLogo } from "./MavLogo";
import { ItemDetail } from "./ItemDetail";
import { SettingsPanel } from "./SettingsPanel";
import { getListings } from "../lib/listings";
import { useAuth } from "../lib/auth-context";
import { getSavedListingIds, saveItem, unsaveItem } from "../lib/saved";
import { useTheme } from "../lib/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 1) / 2;

export function HomePage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allListings, setAllListings] = useState<ListingItem[]>(mockListings);
  const [loadingListings, setLoadingListings] = useState(false);
  const insets = useSafeAreaInsets();

  const loadListings = () => {
    setLoadingListings(true);
    getListings()
      .then((data) => {
        if (data.length > 0) setAllListings(data);
      })
      .catch(() => {
        // Supabase not configured yet — mock data stays
      })
      .finally(() => setLoadingListings(false));
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    if (!user) return;
    getSavedListingIds(user.id)
      .then(setSavedItems)
      .catch(() => {});
  }, [user]);

  const filteredListings = allListings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesPrice = item.price <= maxPrice;
    const matchesCondition = selectedCondition === "All" || item.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
  });

  const toggleSave = (id: string) => {
    const isSaved = savedItems.includes(id);
    setSavedItems((prev) => isSaved ? prev.filter((i) => i !== id) : [...prev, id]);
    if (user) {
      if (isSaved) {
        unsaveItem(user.id, id).catch(() => {
          setSavedItems((prev) => [...prev, id]); // revert on error
        });
      } else {
        saveItem(user.id, id).catch(() => {
          setSavedItems((prev) => prev.filter((i) => i !== id)); // revert on error
        });
      }
    }
  };

  const renderItem = ({ item }: { item: ListingItem }) => (
    <AnimatedCard
      item={item}
      isSaved={savedItems.includes(item.id)}
      onPress={() => setSelectedItem(item)}
      onToggleSave={() => toggleSave(item.id)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MavLogo size={28} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.iconBtn}
          >
            <Search size={22} color={c.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.iconBtn}
          >
            <SlidersHorizontal
              size={22}
              color={showFilters ? c.accent : c.textPrimary}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.iconBtn}
          >
            <Menu size={22} color={c.textPrimary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
          <Search size={16} color={c.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor={c.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: c.textPrimary }]}
            autoFocus
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={c.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { borderBottomColor: c.borderLight }]}>
          <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Max Price</Text>
          <View style={styles.conditionRow}>
            {[50, 100, 250, 500, 1000].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setMaxPrice(p)}
                style={[
                  styles.conditionChip,
                  { backgroundColor: c.surface },
                  maxPrice === p && { backgroundColor: c.accent, borderColor: c.accent },
                ]}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    { color: c.textSecondary },
                    maxPrice === p && { color: c.background },
                  ]}
                >
                  {p === 1000 ? "Any" : `$${p}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.filterLabel, { color: c.textSecondary }]}>Condition</Text>
          <View style={styles.conditionRow}>
            {["All", "Like New", "Good", "Fair"].map((cond) => (
              <TouchableOpacity
                key={cond}
                onPress={() => setSelectedCondition(cond)}
                style={[
                  styles.conditionChip,
                  { backgroundColor: c.surface },
                  selectedCondition === cond && { backgroundColor: c.accent, borderColor: c.accent },
                ]}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    { color: c.textSecondary },
                    selectedCondition === cond && { color: c.background },
                  ]}
                >
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoriesScroll, { borderBottomColor: c.surface }]}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryChip,
              { borderColor: c.border },
              selectedCategory === cat && { backgroundColor: c.accent, borderColor: c.accent },
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: c.textSecondary },
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings Grid */}
      <FlatList
        data={loadingListings ? [] : filteredListings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loadingListings ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={c.accent} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Search size={32} color={c.border} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: c.textTertiary }]}>No items found</Text>
              <Text style={[styles.emptySubtext, { color: c.border }]}>Try adjusting your filters</Text>
            </View>
          )
        }
        style={[styles.list, { backgroundColor: c.surface }]}
      />

      {/* Item Detail Overlay */}
      {selectedItem && (
        <SlideUpOverlay>
          <ItemDetail
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            isSaved={savedItems.includes(selectedItem.id)}
            onToggleSave={() => toggleSave(selectedItem.id)}
          />
        </SlideUpOverlay>
      )}

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

function SlideUpOverlay({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(900)).current;
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 22,
      stiffness: 280,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function AnimatedCard({
  item,
  isSaved,
  onPress,
  onToggleSave,
}: {
  item: ListingItem;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }], backgroundColor: c.surfaceElevated }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
          <TouchableOpacity
            onPress={onToggleSave}
            style={styles.heartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={20}
              color={isSaved ? c.error : "#FFFFFF"}
              fill={isSaved ? c.error : "transparent"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <View style={[styles.priceBadge, { backgroundColor: c.overlay }]}>
            <Text style={styles.priceBadgeText}>${item.price}</Text>
          </View>
        </View>
        <View style={styles.cardCaption}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.conditionPill, { backgroundColor: conditionColor(item.condition, c) + "22" }]}>
              <Text style={[styles.conditionPillText, { color: conditionColor(item.condition, c) }]}>
                {item.condition}
              </Text>
            </View>
          </View>
          <View style={styles.cardSellerRow}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.cardSellerAvatar} />
            <Text style={[styles.cardSellerName, { color: c.textTertiary }]}>{item.sellerName}</Text>
            <Text style={[styles.cardDot, { color: c.border }]}>·</Text>
            <Text style={[styles.cardPostedAt, { color: c.textTertiary }]}>{item.postedAt}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function conditionColor(condition: string, c: ReturnType<typeof useTheme>['theme']['colors']): string {
  switch (condition) {
    case "New": return c.accent;
    case "Like New": return c.success;
    case "Good": return c.warning;
    case "Fair": return c.textTertiary;
    default: return c.textTertiary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  filterLabel: {
    fontSize: 12,
  },
  conditionRow: {
    flexDirection: "row",
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  conditionChipText: {
    fontSize: 12,
  },
  categoriesScroll: {
    borderBottomWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  categoryChipText: {
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  row: {
    gap: 1,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardImageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    position: "relative",
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 6,
  },
  priceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  cardCaption: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 4,
    marginTop: 3,
    marginBottom: 1,
  },
  conditionPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  conditionPillText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardSellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardSellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardSellerName: {
    fontSize: 11,
  },
  cardDot: {
    fontSize: 11,
  },
  cardPostedAt: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    height: 192,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  emptySubtext: {
    fontSize: 12,
  },
});
