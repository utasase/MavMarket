import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { X, Heart, RotateCcw, ShoppingBag } from "lucide-react-native";
import { listings as mockListings, type ListingItem } from "../data/mockData";
import { ItemDetail } from "./ItemDetail";
import { getListings } from "../lib/listings";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width - 32, 380);
const CARD_HEIGHT = CARD_WIDTH * (4 / 3);
const SWIPE_THRESHOLD = 100;

export function SwipePage() {
  const [allItems, setAllItems] = useState<ListingItem[]>(mockListings);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getListings()
      .then((data) => { if (data.length > 0) setAllItems(data); })
      .catch(() => {});
  }, []);

  const availableItems = allItems.filter(
    (item) => !liked.includes(item.id) && !passed.includes(item.id)
  );

  const currentItem = availableItems[0];
  const nextItem = availableItems[1];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentItem) return;
    setExitDirection(direction);
    setTimeout(() => {
      if (direction === "right") {
        setLiked((prev) => [...prev, currentItem.id]);
      } else {
        setPassed((prev) => [...prev, currentItem.id]);
      }
      setExitDirection(null);
    }, 300);
  };

  const handleUndo = () => {
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
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Results screen
  if (showResults || (!currentItem && (liked.length > 0 || passed.length > 0))) {
    const likedItems = allItems.filter((item) => liked.includes(item.id));
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Your Picks</Text>
          <Text style={styles.resultsCount}>{likedItems.length} items</Text>
        </View>
        <FlatList
          data={likedItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyPicks}>
              <Heart size={32} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyPicksText}>No liked items yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedItem(item)}
              style={styles.resultItem}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.image }} style={styles.resultItemImage} />
              <View style={styles.resultItemInfo}>
                <Text style={styles.resultItemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultItemPrice}>${item.price}</Text>
                <Text style={styles.resultItemSeller}>{item.sellerName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        <View style={[styles.startOverContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity onPress={handleReset} style={styles.startOverBtn}>
            <Text style={styles.startOverBtnText}>Start Over</Text>
          </TouchableOpacity>
        </View>

        {selectedItem && (
          <View style={StyleSheet.absoluteFillObject}>
            <ItemDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              isSaved={savedItems.includes(selectedItem.id)}
              onToggleSave={() => toggleSave(selectedItem.id)}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.discoverHeader}>
        <Text style={styles.discoverTitle}>Discover</Text>
        <TouchableOpacity
          onPress={() => setShowResults(true)}
          style={styles.likedCountBtn}
        >
          <Heart size={16} color="#6B7280" strokeWidth={1.5} />
          <Text style={styles.likedCountText}>{liked.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe Area */}
      <View style={styles.swipeArea}>
        {!currentItem ? (
          <View style={styles.noMoreItems}>
            <ShoppingBag size={40} color="#D1D5DB" />
            <Text style={styles.noMoreText}>No more items</Text>
            <TouchableOpacity onPress={handleReset} style={styles.startOverSmallBtn}>
              <Text style={styles.startOverSmallText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.cardStack, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
            {/* Next card preview */}
            {nextItem && (
              <View style={[styles.nextCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
                <Image
                  source={{ uri: nextItem.image }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              </View>
            )}
            {/* Current card */}
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipe={handleSwipe}
              exitDirection={exitDirection}
              cardWidth={CARD_WIDTH}
              cardHeight={CARD_HEIGHT}
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {currentItem && (
        <View style={[styles.actionBtns, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity onPress={handleUndo} style={styles.actionBtnSmall}>
            <RotateCcw size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSwipe("left")}
            style={styles.actionBtnLarge}
          >
            <X size={26} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSwipe("right")}
            style={styles.actionBtnLarge}
          >
            <Heart size={26} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowResults(true)}
            style={styles.actionBtnSmall}
          >
            <ShoppingBag size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function SwipeCard({
  item,
  onSwipe,
  exitDirection,
  cardWidth,
  cardHeight,
}: {
  item: ListingItem;
  onSwipe: (direction: "left" | "right") => void;
  exitDirection: "left" | "right" | null;
  cardWidth: number;
  cardHeight: number;
}) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;

  const rotate = translateX.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-12deg", "0deg", "12deg"],
  });

  const likeOpacity = translateX.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const passOpacity = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  React.useEffect(() => {
    if (exitDirection === "left") {
      Animated.timing(translateX, {
        toValue: -width - 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (exitDirection === "right") {
      Animated.timing(translateX, {
        toValue: width + 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [exitDirection]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
        translateY.setValue(gesture.dy * 0.3);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          onSwipe("right");
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          onSwipe("left");
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          Animated.spring(translateY, {
            toValue: 0,
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
        styles.swipeCard,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* WANT label */}
      <Animated.View style={[styles.wantLabel, { opacity: likeOpacity }]}>
        <Text style={styles.wantText}>WANT</Text>
      </Animated.View>

      {/* PASS label */}
      <Animated.View style={[styles.passLabel, { opacity: passOpacity }]}>
        <Text style={styles.passText}>PASS</Text>
      </Animated.View>

      {/* Gradient-style overlay for readability */}
      <View style={styles.cardGradient} pointerEvents="none" />

      {/* Item info overlay */}
      <View style={styles.cardOverlay}>
        <View style={styles.cardOverlayContent}>
          <View>
            <Text style={styles.cardItemTitle}>{item.title}</Text>
            <View style={styles.cardSellerRow}>
              <Image source={{ uri: item.sellerAvatar }} style={styles.cardSellerAvatar} />
              <Text style={styles.cardSellerName}>{item.sellerName}</Text>
            </View>
          </View>
          <View style={styles.cardPriceBadge}>
            <Text style={styles.cardPriceText}>${item.price}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Results
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultsTitle: {
    fontSize: 18,
    color: "#111827",
  },
  resultsCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  resultItem: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
  },
  resultItemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  resultItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultItemTitle: {
    fontSize: 14,
    color: "#111827",
  },
  resultItemPrice: {
    fontSize: 14,
    color: "#111827",
    marginTop: 2,
  },
  resultItemSeller: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  emptyPicks: {
    height: 192,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyPicksText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  startOverContainer: {
    padding: 16,
  },
  startOverBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  startOverBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  // Discover
  discoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  discoverTitle: {
    fontSize: 18,
    color: "#111827",
  },
  likedCountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likedCountText: {
    fontSize: 14,
    color: "#6B7280",
  },
  swipeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cardStack: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  nextCard: {
    position: "absolute",
    borderRadius: 20,
    overflow: "hidden",
    opacity: 0.4,
    transform: [{ scale: 0.95 }],
  },
  noMoreItems: {
    alignItems: "center",
    gap: 12,
  },
  noMoreText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  startOverSmallBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  startOverSmallText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  actionBtns: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  actionBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  // Swipe card
  swipeCard: {
    position: "absolute",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  wantLabel: {
    position: "absolute",
    top: 32,
    left: 24,
    borderWidth: 2,
    borderColor: "#4ADE80",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: "-12deg" }],
  },
  wantText: {
    color: "#4ADE80",
    fontSize: 18,
    fontWeight: "700",
  },
  passLabel: {
    position: "absolute",
    top: 32,
    right: 24,
    borderWidth: 2,
    borderColor: "#F87171",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{ rotate: "12deg" }],
  },
  passText: {
    color: "#F87171",
    fontSize: 18,
    fontWeight: "700",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  cardOverlayContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardItemTitle: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  cardSellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  cardSellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardSellerName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  cardPriceBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cardPriceText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
});
