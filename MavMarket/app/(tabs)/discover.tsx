import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Modal, FlatList,
} from 'react-native';
import { X, Heart, RotateCcw, ShoppingBag } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listings, type ListingItem } from '../../constants/mockData';
import { ItemDetail } from '../../components/ItemDetail';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  const availableItems = listings.filter(
    (item) => !liked.includes(item.id) && !passed.includes(item.id)
  );
  const currentItem = availableItems[0];
  const nextItem = availableItems[1];

  const handleSwipeRight = useCallback(() => {
    if (currentItem) setLiked((prev) => [...prev, currentItem.id]);
  }, [currentItem]);

  const handleSwipeLeft = useCallback(() => {
    if (currentItem) setPassed((prev) => [...prev, currentItem.id]);
  }, [currentItem]);

  const handleUndo = () => {
    if (passed.length > 0) setPassed((prev) => prev.slice(0, -1));
    else if (liked.length > 0) setLiked((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setLiked([]);
    setPassed([]);
    setShowResults(false);
  };

  const toggleSave = (id: string) => {
    setSavedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Show results
  if (showResults || (!currentItem && (liked.length > 0 || passed.length > 0))) {
    const likedItems = listings.filter((item) => liked.includes(item.id));
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.resultsHeader}>
          <Text style={styles.headerTitle}>Your Picks</Text>
          <Text style={styles.headerCount}>{likedItems.length} items</Text>
        </View>

        {likedItems.length === 0 ? (
          <View style={styles.empty}>
            <Heart size={32} color={Colors.gray300} />
            <Text style={styles.emptyText}>No liked items yet</Text>
          </View>
        ) : (
          <FlatList
            data={likedItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedItem(item)}
                style={styles.resultItem}
              >
                <Image source={{ uri: item.image }} style={styles.resultImage} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.resultPrice}>${item.price}</Text>
                  <Text style={styles.resultSeller}>{item.sellerName}</Text>
                </View>
              </Pressable>
            )}
          />
        )}

        <View style={styles.resetSection}>
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Start Over</Text>
          </Pressable>
        </View>

        <Modal visible={!!selectedItem} animationType="slide">
          {selectedItem && (
            <ItemDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              isSaved={savedItems.includes(selectedItem.id)}
              onToggleSave={() => toggleSave(selectedItem.id)}
            />
          )}
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.swipeHeader}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Pressable onPress={() => setShowResults(true)} style={styles.likedBtn}>
          <Heart size={16} color={Colors.gray500} strokeWidth={1.5} />
          <Text style={styles.likedCount}>{liked.length}</Text>
        </Pressable>
      </View>

      {/* Swipe Area */}
      <View style={styles.swipeArea}>
        {!currentItem ? (
          <View style={styles.empty}>
            <ShoppingBag size={40} color={Colors.gray300} />
            <Text style={styles.emptyText}>No more items</Text>
            <Pressable onPress={handleReset} style={styles.smallResetBtn}>
              <Text style={styles.resetBtnText}>Start Over</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cardContainer}>
            {/* Next card preview */}
            {nextItem && (
              <View style={[styles.card, styles.nextCard]}>
                <Image
                  source={{ uri: nextItem.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>
            )}

            {/* Current swipe card */}
            <SwipeCard
              key={currentItem.id}
              item={currentItem}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {currentItem && (
        <View style={styles.actionButtons}>
          <Pressable onPress={handleUndo} style={styles.smallActionBtn}>
            <RotateCcw size={18} color={Colors.gray400} />
          </Pressable>
          <Pressable onPress={handleSwipeLeft} style={styles.largeActionBtn}>
            <X size={26} color={Colors.gray400} />
          </Pressable>
          <Pressable onPress={handleSwipeRight} style={styles.largeActionBtn}>
            <Heart size={26} color={Colors.gray400} />
          </Pressable>
          <Pressable onPress={() => setShowResults(true)} style={styles.smallActionBtn}>
            <ShoppingBag size={18} color={Colors.gray400} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function SwipeCard({
  item,
  onSwipeLeft,
  onSwipeRight,
}: {
  item: ListingItem;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const translateX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 300 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH - 100, { duration: 300 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-200, 0, 200], [-12, 0, 12])}deg` },
    ],
  }));

  const wantOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 100], [0, 1], 'clamp'),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-100, 0], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          source={{ uri: item.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />

        {/* WANT overlay */}
        <Animated.View style={[styles.swipeLabel, styles.wantLabel, wantOpacity]}>
          <Text style={[styles.swipeLabelText, { color: Colors.green400 }]}>WANT</Text>
        </Animated.View>

        {/* PASS overlay */}
        <Animated.View style={[styles.swipeLabel, styles.passLabel, passOpacity]}>
          <Text style={[styles.swipeLabelText, { color: Colors.red500 }]}>PASS</Text>
        </Animated.View>

        {/* Info overlay */}
        <View style={styles.cardInfo}>
          <View style={styles.cardInfoContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardSeller}>
                <Image source={{ uri: item.sellerAvatar }} style={styles.cardSellerAvatar} />
                <Text style={styles.cardSellerName}>{item.sellerName}</Text>
              </View>
            </View>
            <View style={styles.cardPriceBadge}>
              <Text style={styles.cardPrice}>${item.price}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  swipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  headerCount: { fontSize: 12, color: Colors.gray400 },
  likedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likedCount: { fontSize: 14, color: Colors.gray500 },
  swipeArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  cardContainer: { width: '100%', aspectRatio: 3 / 4, maxWidth: 340 },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  nextCard: { transform: [{ scale: 0.95 }], opacity: 0.4 },
  swipeLabel: {
    position: 'absolute',
    top: 32,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wantLabel: { left: 24, borderColor: Colors.green400, transform: [{ rotate: '-12deg' }] },
  passLabel: { right: 24, borderColor: Colors.red500, transform: [{ rotate: '12deg' }] },
  swipeLabelText: { fontSize: 18, fontWeight: '700' },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 96,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardInfoContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTitle: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  cardSeller: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  cardSellerAvatar: { width: 20, height: 20, borderRadius: 10 },
  cardSellerName: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  cardPriceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardPrice: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 20,
    paddingTop: 12,
  },
  smallActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: Colors.gray400 },
  smallResetBtn: {
    backgroundColor: Colors.black,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  resultItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  resultImage: { width: 64, height: 64, borderRadius: 10 },
  resultTitle: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  resultPrice: { fontSize: 14, color: Colors.gray900, marginTop: 2 },
  resultSeller: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  resetSection: { padding: 16, paddingBottom: 34 },
  resetBtn: {
    backgroundColor: Colors.black,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetBtnText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
});
