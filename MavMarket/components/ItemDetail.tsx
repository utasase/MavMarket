import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';
import { StarRating } from './StarRating';
import { PickupMap } from './PickupMap';
import { ReviewsViewer, generateMockReviews } from './ReviewsViewer';
import { Colors } from '../constants/colors';
import type { ListingItem } from '../constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ItemDetailProps {
  item: ListingItem;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function ItemDetail({ item, onBack, isSaved, onToggleSave }: ItemDetailProps) {
  const [showReviews, setShowReviews] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false}>
        {/* Image */}
        <View>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
          />
          <Pressable onPress={onBack} style={styles.backBtn}>
            <ChevronLeft size={20} color={Colors.white} />
          </Pressable>
          <Pressable onPress={onToggleSave} style={styles.saveBtn}>
            <Heart
              size={20}
              color={isSaved ? Colors.red500 : Colors.white}
              fill={isSaved ? Colors.red500 : 'transparent'}
              strokeWidth={1.5}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
              <Text style={styles.postedAt}>{item.postedAt}</Text>
            </View>
          </View>

          {/* Seller */}
          <View style={styles.sellerRow}>
            <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{item.sellerName}</Text>
              <Pressable onPress={() => setShowReviews(true)}>
                <StarRating rating={item.sellerRating} size={11} />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Pickup Location */}
          <PickupMap location={item.pickupLocation} />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.messageBtn}>
          <Text style={styles.messageBtnText}>Message Seller</Text>
        </Pressable>
        <Pressable onPress={onToggleSave} style={styles.saveBtnBottom}>
          <Text style={styles.saveBtnBottomText}>{isSaved ? 'Saved' : 'Save'}</Text>
        </Pressable>
      </View>

      <ReviewsViewer
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        sellerName={item.sellerName}
        overallRating={item.sellerRating}
        reviews={generateMockReviews(item.sellerName)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  image: { width: SCREEN_WIDTH, aspectRatio: 1 },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  saveBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  content: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, color: Colors.black, fontWeight: '600', flex: 1, marginRight: 8 },
  price: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  conditionBadge: { backgroundColor: Colors.gray50, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  conditionText: { fontSize: 12, color: Colors.gray400 },
  postedAt: { fontSize: 12, color: Colors.gray400 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray100,
  },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20 },
  sellerName: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  description: { fontSize: 14, color: Colors.gray600, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  messageBtnText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
  saveBtnBottom: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
  },
  saveBtnBottomText: { color: Colors.gray700, fontSize: 14 },
});
