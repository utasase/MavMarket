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

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 1) / 2;

export function HomePage() {
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Search size={22} color="#111827" strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.iconBtn}
          >
            <SlidersHorizontal
              size={22}
              color={showFilters ? "#0064B1" : "#111827"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.iconBtn}
          >
            <Menu size={22} color="#111827" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoFocus
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Max Price</Text>
          <View style={styles.conditionRow}>
            {[50, 100, 250, 500, 1000].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setMaxPrice(p)}
                style={[
                  styles.conditionChip,
                  maxPrice === p && styles.conditionChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    maxPrice === p && styles.conditionChipTextActive,
                  ]}
                >
                  {p === 1000 ? "Any" : `$${p}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.filterLabel}>Condition</Text>
          <View style={styles.conditionRow}>
            {["All", "Like New", "Good", "Fair"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCondition(c)}
                style={[
                  styles.conditionChip,
                  selectedCondition === c && styles.conditionChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    selectedCondition === c && styles.conditionChipTextActive,
                  ]}
                >
                  {c}
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
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
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
              <ActivityIndicator color="#0064B1" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Search size={32} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No items found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          )
        }
        style={styles.list}
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
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
              color={isSaved ? "#EF4444" : "#FFFFFF"}
              fill={isSaved ? "#EF4444" : "transparent"}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${item.price}</Text>
          </View>
        </View>
        <View style={styles.cardCaption}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <View style={[styles.conditionPill, { backgroundColor: conditionColor(item.condition) + "22" }]}>
              <Text style={[styles.conditionPillText, { color: conditionColor(item.condition) }]}>
                {item.condition}
              </Text>
            </View>
          </View>
          <View style={styles.cardSellerRow}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.cardSellerAvatar} />
            <Text style={styles.cardSellerName}>{item.sellerName}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardPostedAt}>{item.postedAt}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function conditionColor(condition: string): string {
  switch (condition) {
    case "New": return "#0064B1";
    case "Like New": return "#059669";
    case "Good": return "#D97706";
    case "Fair": return "#9CA3AF";
    default: return "#9CA3AF";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
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
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  conditionRow: {
    flexDirection: "row",
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "#F3F4F6",
  },
  conditionChipActive: {
    backgroundColor: "#0064B1",
    borderColor: "#0064B1",
  },
  conditionChipText: {
    fontSize: 12,
    color: "#4B5563",
  },
  conditionChipTextActive: {
    color: "#FFFFFF",
  },
  categoriesScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
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
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
  },
  categoryChipActive: {
    backgroundColor: "#0064B1",
    borderColor: "#0064B1",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  list: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  row: {
    gap: 1,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(0,0,0,0.7)",
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
    color: "#111827",
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
    color: "#9CA3AF",
  },
  cardDot: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  cardPostedAt: {
    fontSize: 11,
    color: "#9CA3AF",
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
    color: "#9CA3AF",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#D1D5DB",
  },
});
