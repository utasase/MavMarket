import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface PickupMapProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    isOnCampus: boolean;
  };
}

export function PickupMap({ location }: PickupMapProps) {
  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${location.lat},${location.lng}`,
      android: `geo:${location.lat},${location.lng}?q=${location.lat},${location.lng}(${location.name})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <MapPin size={14} color={Colors.gray400} />
        <Text style={styles.label}>Pickup Location</Text>
      </View>

      <View style={styles.card}>
        {/* Map placeholder - replace with react-native-maps MapView if desired */}
        <View style={styles.mapPlaceholder}>
          {/* Grid lines */}
          <View style={[styles.gridLine, styles.hLine, { top: '30%' }]} />
          <View style={[styles.gridLine, styles.hLine, { top: '55%' }]} />
          <View style={[styles.gridLine, styles.vLine, { left: '45%' }]} />
          <View style={[styles.gridLine, styles.vLine, { left: '75%' }]} />

          {/* Pin */}
          <View style={styles.pinContainer}>
            <View style={styles.pinDot}>
              <View style={styles.pinInner} />
            </View>
            <View style={styles.pinTriangle} />
          </View>

          {location.isOnCampus && (
            <View style={styles.campusBadge}>
              <Text style={styles.campusText}>On Campus</Text>
            </View>
          )}
        </View>

        {/* Location details */}
        <View style={styles.details}>
          <Text style={styles.locName}>{location.name}</Text>
          <Text style={styles.locAddress}>{location.address}</Text>
          <Pressable onPress={openInMaps} style={styles.mapsButton}>
            <MapPin size={10} color={Colors.utaBlue} />
            <Text style={styles.mapsText}>Open in Maps</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, color: Colors.gray500 },
  card: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.gray100 },
  mapPlaceholder: {
    height: 144,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLine: { position: 'absolute', backgroundColor: Colors.gray200 },
  hLine: { left: 0, right: 0, height: 2 },
  vLine: { top: 0, bottom: 0, width: 2 },
  pinContainer: { alignItems: 'center' },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  pinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.black,
    marginTop: -2,
  },
  campusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  campusText: { color: Colors.white, fontSize: 10 },
  details: { padding: 12, backgroundColor: Colors.white },
  locName: { fontSize: 14, color: Colors.black },
  locAddress: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  mapsButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  mapsText: { fontSize: 11, color: Colors.utaBlue },
});
