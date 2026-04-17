import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, SlidersHorizontal, X, Heart, Compass } from "lucide-react-native";
import { listings as mockListings, categories, DEMO_MODE } from "../data/mockData";
import { type ListingItem, type ColorTokens, type Theme } from "../lib/types";
import { MavLogo } from "./MavLogo";
import { ItemDetail } from "./ItemDetail";
import { HeaderMenu } from "./HeaderMenu";
import { getListings } from "../lib/listings";
import { useSaved } from "../lib/SavedContext";
import { useTheme } from "../lib/ThemeContext";
import { Chip } from "./ui/Chip";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { EmptyState } from "./ui/EmptyState";
import { ListItemEnter } from "./ui/ListItemEnter";
import { Skeleton } from "./ui/Skeleton";
import { Badge } from "./ui/Badge";
import { spacing, radius } from "../lib/theme";

const { width } = Dimensions.get("window");
const GUTTER = spacing.lg;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (width - GUTTER * 2 - CARD_GAP) / 2;

export function HomePage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.typography;
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const { savedIds: savedItems, toggleSave: toggleSavedItem, refresh: refreshSaved } = useSaved();
  const [showSearch, setShowSearch] = useState(false);
  const [allListings, setAllListings] = useState<ListingItem[]>(mockListings);
  const [loadingListings, setLoadingListings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = useCallback(() => {
    if (DEMO_MODE) {
      setAllListings([...mockListings]);
      return;
    }
    setLoadingListings(true);
    getListings()
      .then((data) => {
        setAllListings(data);
      })
      .catch((error) => {
        console.error("Listings fetch error:", error);
      })
      .finally(() => setLoadingListings(false));
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Refresh listings whenever the Home tab regains focus.
  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  useFocusEffect(
    useCallback(() => {
      refreshSaved();
    }, [refreshSaved])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (DEMO_MODE) {
      setAllListings([...mockListings]);
      setRefreshing(false);
      return;
    }
    getListings()
      .then((data) => setAllListings(data))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, []);

  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesPrice = item.price <= maxPrice;
      const matchesCondition =
        selectedCondition === "All" || item.condition === selectedCondition;
      return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
    });
  }, [allListings, searchQuery, selectedCategory, maxPrice, selectedCondition]);

  const toggleSave = useCallback(
    (id: string) => {
      const item = allListings.find((l) => l.id === id);
      if (!item) return;
      toggleSavedItem(item);
    },
    [allListings, toggleSavedItem]
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const renderItem = ({ item, index }: { item: ListingItem; index: number }) => (
    <ListItemEnter index={index % 8}>
      <ListingCard
        item={item}
        isSaved={savedItems.includes(item.id)}
        onPress={() => setSelectedItem(item)}
        onToggleSave={() => toggleSave(item.id)}
      />
    </ListItemEnter>
  );

  const showSkeletons = loadingListings && allListings.length === 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: c.background },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoFrame}>
            <MavLogo size={28} />
          </View>
          <Text style={styles.brandText}>Mav Market</Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon={<Search size={20} color={c.textPrimary} strokeWidth={1.75} />}
            onPress={() => setShowSearch((v) => !v)}
            accessibilityLabel="Search"
            size={40}
          />
          <IconButton
            icon={
              <SlidersHorizontal
                size={20}
                color={showFilters ? c.accentLight : c.textPrimary}
                strokeWidth={1.75}
              />
            }
            onPress={() => setShowFilters((v) => !v)}
            accessibilityLabel="Filters"
            size={40}
            variant={showFilters ? "accent" : "plain"}
          />
          <HeaderMenu savedItemIds={savedItems} onToggleSave={toggleSave} />
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search listings"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            leftIcon={<Search size={16} color={c.textTertiary} />}
            rightIcon={
              searchQuery !== "" ? (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <X size={16} color={c.textTertiary} />
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>
      )}

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Max price</Text>
          <View style={styles.chipRow}>
            {[50, 100, 250, 500, 1000].map((p) => (
              <Chip
                key={p}
                label={p === 1000 ? "Any" : `$${p}`}
                selected={maxPrice === p}
                onPress={() => setMaxPrice(p)}
                size="sm"
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Condition</Text>
          <View style={styles.chipRow}>
            {["All", "Like New", "Good", "Fair"].map((cond) => (
              <Chip
                key={cond}
                label={cond}
                selected={selectedCondition === cond}
                onPress={() => setSelectedCondition(cond)}
                size="sm"
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={showSkeletons ? [] : filteredListings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.accentLight}
            colors={[c.accentLight]}
            progressBackgroundColor={c.surface}
          />
        }
        ListHeaderComponent={
          showSkeletons ? (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={{ width: CARD_WIDTH, marginBottom: spacing.lg }}>
                  <Skeleton width={CARD_WIDTH} height={CARD_WIDTH} radius={radius.md} />
                  <View style={{ height: spacing.sm }} />
                  <Skeleton height={14} radius={radius.xs} width="80%" />
                  <View style={{ height: spacing.xs }} />
                  <Skeleton height={12} radius={radius.xs} width="50%" />
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          showSkeletons ? null : (
            <EmptyState
              icon={<Compass size={28} color={c.textTertiary} strokeWidth={1.75} />}
              title={
                searchQuery || selectedCategory !== "All"
                  ? "No matches just yet"
                  : "No listings yet"
              }
              description={
                searchQuery || selectedCategory !== "All"
                  ? "Try a different filter, or be the first to list something in this category."
                  : "Be the first Maverick to post a listing today."
              }
              ctaLabel={
                searchQuery || selectedCategory !== "All"
                  ? "Clear filters"
                  : undefined
              }
              onCta={
                searchQuery || selectedCategory !== "All"
                  ? () => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setMaxPrice(1000);
                      setSelectedCondition("All");
                    }
                  : undefined
              }
            />
          )
        }
        style={styles.list}
      />

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
  }, [translateY]);
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}

function ListingCard({
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
  const t = theme.typography;
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: theme.motion.pressScale,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const tapHeart = () => {
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.25,
        useNativeDriver: true,
        speed: 60,
        bounciness: 12,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
    ]).start();
    onToggleSave();
  };

  const conditionTone = condTone(item.condition);

  const handleHeartPress = (e?: any) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    tapHeart();
  };

  return (
    <Animated.View
      style={[
        cardStyles.card,
        theme.elevation.level1,
        {
          width: CARD_WIDTH,
          backgroundColor: c.surface,
          borderColor: c.hairline,
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.price} dollars`}
      >
        <View style={[cardStyles.imageBox, { width: CARD_WIDTH, height: CARD_WIDTH }]}>
          <Image
            source={{ uri: item.image }}
            style={cardStyles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            locations={[0.5, 1]}
            style={cardStyles.imageScrim}
            pointerEvents="none"
          />
          <View style={cardStyles.priceChip}>
            <Text style={cardStyles.priceText}>${item.price}</Text>
          </View>
        </View>
        <View style={cardStyles.body}>
          <Text
            style={{
              color: c.textPrimary,
              fontFamily: t.bodyStrong.fontFamily,
              fontSize: 14,
              lineHeight: 18,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={cardStyles.metaRow}>
            <Badge label={item.condition} tone={conditionTone} />
          </View>
          <View style={cardStyles.sellerRow}>
            <Image
              source={{ uri: item.sellerAvatar }}
              style={cardStyles.sellerAvatar}
            />
            <Text
              style={{
                color: c.textTertiary,
                fontFamily: t.caption.fontFamily,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {item.sellerName} · {item.postedAt}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <Animated.View
        style={[cardStyles.heartWrap, { transform: [{ scale: heartScale }] }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={handleHeartPress}
          hitSlop={8}
          style={[cardStyles.heartBtn, { backgroundColor: "rgba(0,0,0,0.42)" }]}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Unsave" : "Save"}
        >
          <Heart
            size={16}
            color={isSaved ? c.error : "#FFFFFF"}
            fill={isSaved ? c.error : "transparent"}
            strokeWidth={1.75}
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function condTone(condition: string): "accent" | "success" | "warning" | "neutral" {
  switch (condition) {
    case "New":
      return "accent";
    case "Like New":
      return "success";
    case "Good":
      return "warning";
    default:
      return "neutral";
  }
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  imageBox: {
    position: "relative",
    backgroundColor: "#000",
  },
  image: { width: "100%", height: "100%" },
  imageScrim: { ...StyleSheet.absoluteFillObject },
  heartWrap: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  priceChip: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#222",
  },
});

function makeStyles(theme: Theme) {
  const c: ColorTokens = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    logoFrame: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      overflow: "hidden",
    },
    brandText: {
      color: c.textPrimary,
      fontFamily: t.headline.fontFamily,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    filterPanel: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    filterLabel: {
      color: c.textSecondary,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
      letterSpacing: 0.1,
      fontWeight: "500",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    categoriesScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    categoriesContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    list: { flex: 1 },
    gridContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.huge,
    },
    row: {
      gap: CARD_GAP,
    },
    skeletonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
  });
}
