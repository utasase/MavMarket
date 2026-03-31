import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { MapPin } from "lucide-react-native";

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
  const openMaps = () => {
    const url = `maps://maps.apple.com/?q=${encodeURIComponent(location.address)}&ll=${location.lat},${location.lng}`;
    Linking.openURL(url).catch(() => {
      const webUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      Linking.openURL(webUrl);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <MapPin size={14} color="#9CA3AF" />
        <Text style={styles.label}>Pickup Location</Text>
      </View>

      <View style={styles.card}>
        {/* Simplified map placeholder with road lines */}
        <View style={styles.mapPlaceholder}>
          {/* Horizontal road */}
          <View style={[styles.road, styles.roadH]} />
          {/* Vertical road */}
          <View style={[styles.road, styles.roadV]} />
          {/* Secondary roads */}
          <View style={[styles.road, styles.roadH2]} />
          <View style={[styles.road, styles.roadV2]} />

          {/* Pin */}
          <View style={styles.pinWrapper}>
            <View style={styles.pinCircle}>
              <View style={styles.pinDot} />
            </View>
            <View style={styles.pinTip} />
          </View>

          {location.isOnCampus && (
            <View style={styles.onCampusBadge}>
              <Text style={styles.onCampusText}>On Campus</Text>
            </View>
          )}
        </View>

        {/* Location details */}
        <View style={styles.details}>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationAddress}>{location.address}</Text>
          <TouchableOpacity onPress={openMaps} style={styles.openMapsRow}>
            <MapPin size={10} color="#0064B1" />
            <Text style={styles.openMapsText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mapPlaceholder: {
    height: 136,
    backgroundColor: "#F9FAFB",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  road: {
    position: "absolute",
    backgroundColor: "#E5E7EB",
  },
  roadH: {
    left: 0,
    right: 0,
    height: 3,
    top: "55%",
  },
  roadV: {
    top: 0,
    bottom: 0,
    width: 3,
    left: "45%",
  },
  roadH2: {
    left: 0,
    right: 0,
    height: 2,
    top: "30%",
    backgroundColor: "#F3F4F6",
  },
  roadV2: {
    top: 0,
    bottom: 0,
    width: 2,
    left: "75%",
    backgroundColor: "#F3F4F6",
  },
  pinWrapper: {
    alignItems: "center",
    position: "absolute",
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#111827",
    marginTop: -1,
  },
  onCampusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  onCampusText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  details: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  locationName: {
    fontSize: 14,
    color: "#111827",
  },
  locationAddress: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  openMapsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  openMapsText: {
    fontSize: 11,
    color: "#0064B1",
  },
});
