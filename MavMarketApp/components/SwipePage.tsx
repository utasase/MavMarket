import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X,
  Heart,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from "lucide-react-native";
import {
  listings as mockListings,
  DEMO_MODE,
} from "../data/mockData";
import { type ListingItem, type Theme } from "../lib/types";
import { ItemDetail } from "./ItemDetail";
import { getListings } from "../lib/listings";
import { HeaderMenu } from "./HeaderMenu";
import { useTheme } from "../lib/ThemeContext";
import { useSaved } from "../lib/SavedContext";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width - spacing.xl * 2, 380);
const CARD_HEIGHT = CARD_WIDTH * 1.35;
const SWIPE_THRESHOLD = 110;
const TAP_SLOP = 8;

function triggerHaptic(style: "light" | "medium" | "success") {
  if (Platform.OS === "web") return;
  try {
    if (style === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (style === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // ignore
  }
}

export function SwipePage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { savedIds: savedItems, toggleSave: toggleSavedItem, setSaved, refresh: refreshSaved } = useSaved();

  const [allItems, setAllItems] = useState<ListingItem[]>(mockListings);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);

  useEffect(() => {
    if (DEMO_MODE) return;
    getListings()
      .then((data) => {
        if (data.length > 0) setAllItems(data);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSaved();
    }, [refreshSaved])
  );

  const availableItems = allItems.filter(
    (item) => !liked.includes(item.id) && !passed.includes(item.id)
  );

  const currentItem = availableItems[0];
  const nextItem = availableItems[1];
  const afterNextItem = availableItems[2];

  const persistSave = useCallback(
    (id: string) => {
      const item = allItems.find((i) => i.id === id);
      if (!item) return;
      setSaved(item, true);
    },
    [allItems, setSaved]
  );

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentItem) return;
    const itemId = currentItem.id;
    if (direction === "right") {
      triggerHaptic("success");
      persistSave(itemId);
    } else {
      triggerHaptic("medium");
    }
    setExitDirection(direction);
    setTimeout(() => {
      if (direction === "right") {
        setLiked((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      } else {
        setPassed((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      }
      setExitDirection(null);
    }, 240);
  };

  const handleUndo = () => {
    triggerHaptic("light");
    if (passed.length > 0) {
      setPassed((prev) => prev.slice(0, -1));
    } else if (liked.length > 0) {
      setLiked((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setLiked([]);
    setPassed([]);
    setExitDirection(null);
    setShowResults(false);
  };

  const toggleSave = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (!item) return;
    toggleSavedItem(item);
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Results screen
  if (showResults || (!currentItem && (liked.length > 0 || passed.length > 0))) {
    const likedItems = allItems.filter((item) => liked.includes(item.id));
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: c.background },
        ]}
      >
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Your picks</Text>
            <Text style={styles.resultsCount}>
              {likedItems.length} {likedItems.length === 1 ? "item" : "items"}{" "}
              saved
            </Text>
          </View>
          <IconButton
            icon={<RotateCcw size={18} color={c.textPrimary} strokeWidth={1.85} />}
            onPress={handleReset}
            accessibilityLabel="Start over"
            size={40}
          />
        </View>
        <FlatList
          data={likedItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <EmptyState
              icon={<Heart size={22} color={c.textTertiary} />}
              title="No picks yet"
              description="Swipe right on items you love to build a shortlist."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedItem(item)}
              style={[
                styles.resultItem,
                theme.elevation.level1,
                { backgroundColor: c.surface, borderColor: c.hairline },
              ]}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.resultItemImage}
              />
              <View style={styles.resultItemInfo}>
                <Text
                  style={styles.resultItemTitle}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.resultItemPrice}>${item.price}</Text>
                <Text style={styles.resultItemSeller}>
                  {item.sellerName}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
        <View
          style={[
            styles.startOverContainer,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <Button
            label="Keep discovering"
            onPress={handleReset}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>

        {selectedItem ? (
          <View style={StyleSheet.absoluteFillObject}>
            <ItemDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              isSaved={savedItems.includes(selectedItem.id)}
              onToggleSave={() => toggleSave(selectedItem.id)}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: c.background },
      ]}
    >
      <View style={styles.discoverHeader}>
        <View style={styles.titleWrap}>
          <Text style={styles.discoverTitle}>Discover</Text>
          <Text style={styles.discoverSubtitle}>
            Swipe through listings across campus
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <TouchableOpacity
            onPress={() => setShowResults(true)}
            style={[
              styles.likedCountBtn,
              {
                backgroundColor: c.accent100,
                borderColor: c.accent200,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${liked.length} liked items`}
          >
            <Heart
              size={14}
              color={c.accentLight}
              fill={c.accentLight}
              strokeWidth={1.85}
            />
            <Text style={[styles.likedCountText, { color: c.accentLight }]}>
              {liked.length}
            </Text>
          </TouchableOpacity>
          <HeaderMenu />
        </View>
      </View>

      <View style={styles.swipeArea}>
        {!currentItem ? (
          <EmptyState
            icon={<Sparkles size={22} color={c.textTertiary} />}
            title="You're all caught up"
            description="New listings from UTA students will appear here soon."
            ctaLabel="Start over"
            onCta={handleReset}
          />
        ) : (
          <View
            style={[styles.cardStack, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          >
            {afterNextItem ? (
              <View
                style={[
                  styles.stackCard,
                  {
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    transform: [{ scale: 0.88 }, { translateY: 20 }],
                    opacity: 0.5,
                  },
                ]}
              >
                <Image
                  source={{ uri: afterNextItem.image }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            {nextItem ? (
              <View
                style={[
                  styles.stackCard,
                  {
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    transform: [{ scale: 0.94 }, { translateY: 10 }],
                    opacity: 0.75,
                  },
                ]}
              >
                <Image
                  source={{ uri: nextItem.image }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              </View>
            ) : null}
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipe={handleSwipe}
              onTap={() => setSelectedItem(currentItem)}
              exitDirection={exitDirection}
              cardWidth={CARD_WIDTH}
              cardHeight={CARD_HEIGHT}
              theme={theme}
            />
          </View>
        )}
      </View>

      {currentItem ? (
        <View
          style={[
            styles.actionBtns,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <SpringActionButton
            onPress={handleUndo}
            size={48}
            bg={c.surface}
            borderColor={c.hairline}
            accessibilityLabel="Undo"
          >
            <RotateCcw size={18} color={c.textSecondary} strokeWidth={2} />
          </SpringActionButton>
          <SpringActionButton
            onPress={() => handleSwipe("left")}
            size={64}
            bg={c.errorSurface}
            borderColor={c.error}
            accessibilityLabel="Pass"
          >
            <X size={28} color={c.error} strokeWidth={2.2} />
          </SpringActionButton>
          <SpringActionButton
            onPress={() => handleSwipe("right")}
            size={64}
            bg={c.accentSurface}
            borderColor={c.accentLight}
            accessibilityLabel="Save"
          >
            <Heart size={28} color={c.accentLight} strokeWidth={2.2} />
          </SpringActionButton>
          <SpringActionButton
            onPress={() => setShowResults(true)}
            size={48}
            bg={c.surface}
            borderColor={c.hairline}
            accessibilityLabel="View picks"
          >
            <ShoppingBag size={18} color={c.textSecondary} strokeWidth={2} />
          </SpringActionButton>
        </View>
      ) : null}

      {selectedItem ? (
        <View style={StyleSheet.absoluteFillObject}>
          <ItemDetail
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            isSaved={savedItems.includes(selectedItem.id)}
            onToggleSave={() => toggleSave(selectedItem.id)}
          />
        </View>
      ) : null}
    </View>
  );
}

function SwipeCard({
  item,
  onSwipe,
  onTap,
  exitDirection,
  cardWidth,
  cardHeight,
  theme,
}: {
  item: ListingItem;
  onSwipe: (direction: "left" | "right") => void;
  onTap: () => void;
  exitDirection: "left" | "right" | null;
  cardWidth: number;
  cardHeight: number;
  theme: Theme;
}) {
  const c = theme.colors;
  const t = theme.typography;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const likeOpacity = translateX.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const passOpacity = translateX.interpolate({
    inputRange: [-120, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const tintOpacity = translateX.interpolate({
    inputRange: [-200, -40, 0, 40, 200],
    outputRange: [0.55, 0, 0, 0, 0.55],
    extrapolate: "clamp",
  });

  const lastHapticBucket = useRef<number>(0);

  useEffect(() => {
    if (exitDirection === "left") {
      Animated.timing(translateX, {
        toValue: -width - 120,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else if (exitDirection === "right") {
      Animated.timing(translateX, {
        toValue: width + 120,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        damping: 18,
        stiffness: 260,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitDirection]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
        translateY.setValue(gesture.dy * 0.25);
        const bucket =
          Math.abs(gesture.dx) > SWIPE_THRESHOLD
            ? Math.sign(gesture.dx)
            : 0;
        if (bucket !== lastHapticBucket.current) {
          lastHapticBucket.current = bucket;
          if (bucket !== 0) {
            triggerHaptic("light");
          }
        }
      },
      onPanResponderRelease: (_, gesture) => {
        lastHapticBucket.current = 0;
        if (gesture.dx > SWIPE_THRESHOLD) {
          onSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          onSwipe("left");
        } else if (
          Math.abs(gesture.dx) < TAP_SLOP &&
          Math.abs(gesture.dy) < TAP_SLOP
        ) {
          Animated.spring(translateX, {
            toValue: 0,
            damping: 18,
            stiffness: 260,
            useNativeDriver: true,
          }).start();
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 260,
            useNativeDriver: true,
          }).start();
          onTap();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            damping: 18,
            stiffness: 260,
            useNativeDriver: true,
          }).start();
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 260,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        cardStyles.card,
        theme.elevation.level3,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: c.surface,
          borderColor: c.hairline,
          borderWidth: theme.dark ? 1 : 0,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: c.error,
            opacity: Animated.multiply(tintOpacity, passOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })),
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: c.accent,
            opacity: Animated.multiply(tintOpacity, likeOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })),
          },
        ]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        locations={[0, 0.4]}
        style={[StyleSheet.absoluteFillObject, { height: cardHeight * 0.25 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        style={[
          cardStyles.wantLabel,
          {
            opacity: likeOpacity,
            borderColor: c.accentLight,
          },
        ]}
      >
        <Text style={[cardStyles.wantText, { color: c.accentLight }]}>
          SAVE
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          cardStyles.passLabel,
          {
            opacity: passOpacity,
            borderColor: c.error,
          },
        ]}
      >
        <Text style={[cardStyles.passText, { color: c.error }]}>PASS</Text>
      </Animated.View>

      <View style={cardStyles.topRow}>
        <View
          style={[
            cardStyles.priceBadge,
            { backgroundColor: "rgba(0,0,0,0.45)" },
          ]}
        >
          <Text
            style={[
              cardStyles.priceText,
              { fontFamily: t.bodyStrong.fontFamily },
            ]}
          >
            ${item.price}
          </Text>
        </View>
        <View
          style={[
            cardStyles.conditionBadge,
            { backgroundColor: "rgba(0,0,0,0.45)" },
          ]}
        >
          <Text
            style={[
              cardStyles.conditionText,
              { fontFamily: t.label.fontFamily },
            ]}
          >
            {item.condition}
          </Text>
        </View>
      </View>

      <View style={cardStyles.overlayContent}>
        <Text
          style={[
            cardStyles.title,
            { fontFamily: t.title.fontFamily },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={cardStyles.sellerRow}>
          <Avatar source={item.sellerAvatar} name={item.sellerName} size={24} />
          <Text style={cardStyles.sellerName} numberOfLines={1}>
            {item.sellerName}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SpringActionButton({
  children,
  onPress,
  size,
  bg,
  borderColor,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  size: number;
  bg: string;
  borderColor: string;
  accessibilityLabel: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: radius.xxl,
    overflow: "hidden",
  },
  topRow: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  conditionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  conditionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  overlayContent: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sellerName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    flex: 1,
  },
  wantLabel: {
    position: "absolute",
    top: 48,
    left: 24,
    borderWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    transform: [{ rotate: "-12deg" }],
  },
  wantText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  passLabel: {
    position: "absolute",
    top: 48,
    right: 24,
    borderWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    transform: [{ rotate: "12deg" }],
  },
  passText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
});

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: { flex: 1 },
    discoverHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    titleWrap: {
      flex: 1,
    },
    discoverTitle: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    discoverSubtitle: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      marginTop: 2,
    },
    likedCountBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    likedCountText: {
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      fontWeight: "700",
    },
    swipeArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    cardStack: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    stackCard: {
      position: "absolute",
      borderRadius: radius.xxl,
      overflow: "hidden",
    },
    actionBtns: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.lg,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    // Results screen
    resultsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    resultsTitle: {
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      color: c.textPrimary,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    resultsCount: {
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      color: c.textTertiary,
      marginTop: 2,
    },
    resultsList: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    resultItem: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
    },
    resultItemImage: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
    },
    resultItemInfo: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },
    resultItemTitle: {
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 15,
      color: c.textPrimary,
      fontWeight: "600",
    },
    resultItemPrice: {
      fontFamily: t.body.fontFamily,
      fontSize: 14,
      color: c.accentLight,
      marginTop: 2,
      fontWeight: "700",
    },
    resultItemSeller: {
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
      color: c.textTertiary,
      marginTop: 2,
    },
    startOverContainer: {
      padding: spacing.lg,
    },
  });
}
