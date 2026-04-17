import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from "react-native";
import { MapPin, ExternalLink } from "lucide-react-native";
import { useTheme } from "../lib/ThemeContext";
import { type Theme } from "../lib/types";
import { spacing, radius } from "../lib/theme";
import { Badge } from "./ui/Badge";

interface PickupMapProps {
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    isOnCampus: boolean;
  };
}

// When EXPO_PUBLIC_GOOGLE_MAPS_KEY is set we render a real Google Street View
// image of the pickup spot (primary), falling back to a Google Static Map if
// Street View has no imagery at that location. Without a key, we render a
// composite of OpenStreetMap tiles from the canonical tile.openstreetmap.org
// CDN so the card never shows a blank image.
const GOOGLE_MAPS_KEY =
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY as string | undefined)) ||
  "";

const MAP_WIDTH = 640;
const MAP_HEIGHT = 320;
const MAP_ZOOM = 17;
const STREETVIEW_FOV = 90;
const STREETVIEW_PITCH = 0;
// Preview card height (kept in sync with styles.mapWrap.height).
const PREVIEW_HEIGHT = 160;

function buildStreetViewUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    size: `${MAP_WIDTH}x${MAP_HEIGHT}`,
    location: `${lat},${lng}`,
    fov: String(STREETVIEW_FOV),
    pitch: String(STREETVIEW_PITCH),
    source: "outdoor",
    return_error_code: "true",
    key: GOOGLE_MAPS_KEY,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

function buildGoogleStaticMapUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(MAP_ZOOM),
    size: `${MAP_WIDTH}x${MAP_HEIGHT}`,
    scale: "2",
    maptype: "roadmap",
    markers: `color:0x0064B1|${lat},${lng}`,
    key: GOOGLE_MAPS_KEY,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

// Slippy-map tile math — given a lat/lng/zoom, return the tile indices plus
// the fractional offset (0..1) of the point within its tile.
function lngToTileX(lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  return ((lng + 180) / 360) * n;
}
function latToTileY(lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  );
}

function buildGoogleMapsDeepLink(
  lat: number,
  lng: number,
  address: string
): string {
  const q = encodeURIComponent(address || `${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function buildGoogleStreetViewDeepLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

export function PickupMap({ location }: PickupMapProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Three-tier fallback: Street View → Static Map → OSM tile composite.
  const [stage, setStage] = useState<"streetview" | "staticmap" | "osm">(
    GOOGLE_MAPS_KEY ? "streetview" : "osm"
  );

  // Precompute OSM tile composite geometry (used when stage === "osm"). We
  // render a 3x3 block of 256px tiles around the target point and translate
  // the block so the point sits at the visual center of the card.
  const tileGrid = useMemo(() => {
    const zoom = MAP_ZOOM - 1; // Zoom out slightly so a bit of context shows.
    const xFrac = lngToTileX(location.lng, zoom);
    const yFrac = latToTileY(location.lat, zoom);
    const xTile = Math.floor(xFrac);
    const yTile = Math.floor(yFrac);
    const dx = xFrac - xTile; // 0..1 within tile
    const dy = yFrac - yTile;
    return { zoom, xTile, yTile, dx, dy };
  }, [location.lat, location.lng]);

  const openMaps = () => {
    // Prefer opening a Street View pano when available; otherwise fall back to
    // a normal Maps search for the address.
    const webUrl = GOOGLE_MAPS_KEY
      ? buildGoogleStreetViewDeepLink(location.lat, location.lng)
      : buildGoogleMapsDeepLink(location.lat, location.lng, location.address);

    if (Platform.OS === "ios") {
      const nativeUrl = `comgooglemaps://?q=${encodeURIComponent(
        location.address || `${location.lat},${location.lng}`
      )}&center=${location.lat},${location.lng}&zoom=${MAP_ZOOM}&mapmode=streetview`;
      Linking.canOpenURL(nativeUrl)
        .then((supported) => {
          Linking.openURL(supported ? nativeUrl : webUrl).catch(() => {});
        })
        .catch(() => {
          Linking.openURL(webUrl).catch(() => {});
        });
      return;
    }

    Linking.openURL(webUrl).catch(() => {});
  };

  const renderMapContent = () => {
    if (stage === "streetview") {
      return (
        <Image
          source={{ uri: buildStreetViewUrl(location.lat, location.lng) }}
          style={styles.mapImage}
          resizeMode="cover"
          onError={() => setStage("staticmap")}
        />
      );
    }
    if (stage === "staticmap") {
      return (
        <Image
          source={{ uri: buildGoogleStaticMapUrl(location.lat, location.lng) }}
          style={styles.mapImage}
          resizeMode="cover"
          onError={() => setStage("osm")}
        />
      );
    }

    // OSM tile composite fallback — always renders something real.
    const tileSize = 256;
    const { zoom, xTile, yTile, dx, dy } = tileGrid;
    // Shift so the target (xTile + dx, yTile + dy) is centered in the preview.
    // Preview is effectively (fullWidth x PREVIEW_HEIGHT). We don't know the
    // real pixel width at render time, so we center the 3x3 block on the
    // middle tile and nudge by the within-tile offset.
    const translateX = -tileSize - dx * tileSize + tileSize / 2;
    const translateY =
      -tileSize - dy * tileSize + PREVIEW_HEIGHT / 2;

    const offsets = [-1, 0, 1];
    return (
      <View style={styles.osmBoard} pointerEvents="none">
        <View
          style={[
            styles.osmTilesWrap,
            {
              transform: [
                { translateX: Math.round(translateX) },
                { translateY: Math.round(translateY) },
              ],
            },
          ]}
        >
          {offsets.map((oy) =>
            offsets.map((ox) => {
              const x = xTile + ox;
              const y = yTile + oy;
              const uri = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
              return (
                <Image
                  key={`${x}-${y}`}
                  source={{ uri }}
                  style={{
                    position: "absolute",
                    left: (ox + 1) * tileSize,
                    top: (oy + 1) * tileSize,
                    width: tileSize,
                    height: tileSize,
                  }}
                />
              );
            })
          )}
        </View>
        <View style={styles.osmMarker} pointerEvents="none">
          <View style={styles.osmMarkerDot} />
          <View style={styles.osmMarkerPulse} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openMaps}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={
          GOOGLE_MAPS_KEY
            ? `Open ${location.name} in Google Street View`
            : `Open ${location.name} in Google Maps`
        }
      >
        <View style={styles.mapWrap}>
          {renderMapContent()}
          {location.isOnCampus ? (
            <View style={styles.onCampusBadge}>
              <Badge label="On campus" tone="accent" size="sm" />
            </View>
          ) : null}
        </View>

        <View style={styles.details}>
          <View style={styles.locationRow}>
            <MapPin size={14} color={c.textSecondary} strokeWidth={1.85} />
            <Text style={styles.locationName}>{location.name}</Text>
          </View>
          <Text style={styles.locationAddress}>{location.address}</Text>
          <View style={styles.openMapsRow}>
            <ExternalLink size={12} color={c.accentLight} strokeWidth={2} />
            <Text style={styles.openMapsText}>
              {GOOGLE_MAPS_KEY
                ? "Open in Google Street View"
                : "Open in Google Maps"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: {},
    card: {
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.hairline,
      backgroundColor: c.surface,
    },
    mapWrap: {
      height: PREVIEW_HEIGHT,
      backgroundColor: c.surfaceElevated,
      position: "relative",
      overflow: "hidden",
    },
    mapImage: {
      width: "100%",
      height: "100%",
    },
    osmBoard: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    osmTilesWrap: {
      width: 768,
      height: 768,
      position: "absolute",
      left: "50%",
      top: 0,
    },
    osmMarker: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 1,
      height: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    osmMarkerDot: {
      position: "absolute",
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.accent,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      // Center on the marker anchor point.
      marginLeft: -7,
      marginTop: -7,
    },
    osmMarkerPulse: {
      position: "absolute",
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent,
      opacity: 0.18,
      marginLeft: -16,
      marginTop: -16,
    },
    onCampusBadge: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
    },
    details: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: c.surface,
      gap: 2,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    locationName: {
      color: c.textPrimary,
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 14,
      fontWeight: "600",
    },
    locationAddress: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      marginLeft: 20,
    },
    openMapsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.xs,
      marginLeft: 20,
    },
    openMapsText: {
      color: c.accentLight,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
