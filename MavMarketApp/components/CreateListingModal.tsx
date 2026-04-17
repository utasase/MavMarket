import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  Camera,
  Check,
  Plus,
  ChevronLeft,
  MapPin,
} from "lucide-react-native";
import {
  categories,
  DEMO_MODE,
  listings as mockListings,
} from "../data/mockData";
import { createListing } from "../lib/listings";
import { pickAndUploadListingImage } from "../lib/storage";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/ThemeContext";
import { type Theme } from "../lib/types";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { Chip } from "./ui/Chip";
import { Card } from "./ui/Card";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";
import { PickupMap } from "./PickupMap";

const DEMO_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1080&q=80";

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;
const LISTING_CATEGORIES = categories.filter((c) => c !== "All");

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = 0 | 1 | 2;
const STEPS: { title: string; helper: string }[] = [
  { title: "Photos", helper: "Add a clear photo so Mavericks can see what you're selling." },
  { title: "Details", helper: "What is it, how much, and what shape is it in?" },
  { title: "Pickup", helper: "Where can the buyer meet you?" },
];

export function CreateListingModal({ visible, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.typography;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(LISTING_CATEGORIES[0]);
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>("Good");
  const [description, setDescription] = useState("");
  const [pickupName, setPickupName] = useState("UTA Campus");
  const [pickupAddress, setPickupAddress] = useState(
    "701 S Nedderman Dr, Arlington, TX 76019"
  );
  const [isOnCampus, setIsOnCampus] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const successScale = useRef(new Animated.Value(0.5)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const reset = () => {
    setStep(0);
    setTitle("");
    setPrice("");
    setCategory(LISTING_CATEGORIES[0]);
    setCondition("Good");
    setDescription("");
    setPickupName("UTA Campus");
    setPickupAddress("701 S Nedderman Dr, Arlington, TX 76019");
    setIsOnCampus(true);
    setImageUrl("");
    setError("");
    setShowSuccess(false);
    successScale.setValue(0.5);
    successOpacity.setValue(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    if (!user) {
      setError("Sign in to post a listing.");
      return;
    }
    try {
      setUploading(true);
      setError("");
      if (DEMO_MODE) {
        setImageUrl(DEMO_PLACEHOLDER_IMAGE);
      } else {
        const url = await pickAndUploadListingImage(user.id);
        if (url) setImageUrl(url);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (s: Step): string | null => {
    if (s === 0) {
      if (!imageUrl) return "Add at least one photo.";
    }
    if (s === 1) {
      if (!title.trim()) return "Title is required.";
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0)
        return "Enter a valid price.";
    }
    return null;
  };

  const goNext = () => {
    const v = validateStep(step);
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setStep((step + 1) as Step);
  };

  const goBack = () => {
    setError("");
    if (step === 0) {
      handleClose();
    } else {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Sign in to post a listing.");
      return;
    }
    const v0 = validateStep(0);
    const v1 = validateStep(1);
    if (v0) {
      setStep(0);
      setError(v0);
      return;
    }
    if (v1) {
      setStep(1);
      setError(v1);
      return;
    }
    setError("");
    const parsedPrice = parseFloat(price);
    try {
      setSubmitting(true);
      if (DEMO_MODE) {
        mockListings.unshift({
          id: `demo-${Date.now()}`,
          title: title.trim(),
          price: parsedPrice,
          image: imageUrl || DEMO_PLACEHOLDER_IMAGE,
          category,
          condition,
          description: description.trim(),
          sellerId: user.id,
          sellerName: "You",
          sellerAvatar: "",
          sellerRating: 5.0,
          postedAt: "Just now",
          isSold: false,
          pickupLocation: {
            name: pickupName.trim() || "UTA Campus",
            address: pickupAddress.trim() || "Arlington, TX",
            lat: 32.735687,
            lng: -97.108065,
            isOnCampus,
          },
        });
      } else {
        await createListing({
          title: title.trim(),
          price: parsedPrice,
          category,
          condition,
          description: description.trim(),
          image_url: imageUrl,
          seller_id: user.id,
          pickup_location_name: pickupName.trim() || "UTA Campus",
          pickup_location_address: pickupAddress.trim() || "Arlington, TX",
          is_on_campus: isOnCampus,
        });
      }
      // Brief success flash before dismissing.
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 12,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        reset();
        onCreated();
      }, 900);
    } catch (err: any) {
      setError(err.message ?? "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const headerHeight = Math.max(insets.top, spacing.lg);
  const sheetHeight = Dimensions.get("window").height * 0.92;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                backgroundColor: c.background,
                paddingTop: headerHeight,
              },
            ]}
          >
            <View style={styles.grabberWrap}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
            </View>

            <View style={styles.sheetHeader}>
              <IconButton
                icon={
                  step === 0 ? (
                    <X size={20} color={c.textPrimary} strokeWidth={1.75} />
                  ) : (
                    <ChevronLeft size={20} color={c.textPrimary} strokeWidth={1.75} />
                  )
                }
                onPress={goBack}
                accessibilityLabel={step === 0 ? "Close" : "Back"}
                size={40}
              />
              <View style={styles.stepDots}>
                {STEPS.map((_, i) => {
                  const active = i === step;
                  const passed = i < step;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: active
                            ? c.accentLight
                            : passed
                              ? c.accent200
                              : c.surface,
                          width: active ? 24 : 8,
                          borderColor: c.border,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
              <Text style={styles.stepHelper}>{STEPS[step].helper}</Text>

              {step === 0 && (
                <View style={{ gap: spacing.lg }}>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={uploading}
                    activeOpacity={0.85}
                    style={[
                      styles.photoBox,
                      {
                        backgroundColor: c.surface,
                        borderColor: imageUrl ? c.border : c.border,
                      },
                    ]}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.photoPreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.photoEmpty}>
                        <View
                          style={[
                            styles.photoIconFrame,
                            { backgroundColor: c.surfaceElevated },
                          ]}
                        >
                          <Camera size={28} color={c.accentLight} strokeWidth={1.6} />
                        </View>
                        <Text style={styles.photoLabel}>
                          {uploading ? "Uploading…" : "Tap to add a photo"}
                        </Text>
                        <Text style={styles.photoHint}>
                          Square crops look best in the feed.
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {imageUrl ? (
                    <Button
                      label="Replace photo"
                      onPress={handlePickImage}
                      variant="secondary"
                      leftIcon={
                        <Plus size={16} color={c.textPrimary} strokeWidth={2} />
                      }
                      loading={uploading}
                    />
                  ) : null}
                </View>
              )}

              {step === 1 && (
                <View style={{ gap: spacing.md }}>
                  <Field
                    label="Title"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="What are you selling?"
                    maxLength={80}
                  />
                  <Field
                    label="Price (USD)"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.fieldGroupLabel}>Category</Text>
                  <View style={styles.chipWrap}>
                    {LISTING_CATEGORIES.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        selected={category === cat}
                        onPress={() => setCategory(cat)}
                      />
                    ))}
                  </View>

                  <Text style={styles.fieldGroupLabel}>Condition</Text>
                  <View style={styles.chipWrap}>
                    {CONDITIONS.map((cond) => (
                      <Chip
                        key={cond}
                        label={cond}
                        selected={condition === cond}
                        onPress={() => setCondition(cond)}
                      />
                    ))}
                  </View>

                  <Field
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe your item..."
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                </View>
              )}

              {step === 2 && (
                <View style={{ gap: spacing.md }}>
                  <Card variant="surface" padding="md">
                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>On-campus pickup</Text>
                        <Text style={styles.toggleHelper}>
                          Mavericks-only meetups feel safer.
                        </Text>
                      </View>
                      <Switch
                        value={isOnCampus}
                        onValueChange={setIsOnCampus}
                        trackColor={{ false: c.border, true: c.accent500 }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </Card>
                  <Field
                    label="Pickup location"
                    value={pickupName}
                    onChangeText={setPickupName}
                    placeholder="e.g. UTA Library"
                    leftIcon={
                      <MapPin
                        size={18}
                        color={c.textSecondary}
                        strokeWidth={1.75}
                      />
                    }
                  />
                  <Field
                    label="Address"
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    placeholder="Street, city, ZIP"
                  />
                  {pickupName ? (
                    <PickupMap
                      location={{
                        name: pickupName || "UTA Campus",
                        address: pickupAddress,
                        lat: 32.735687,
                        lng: -97.108065,
                        isOnCampus,
                      }}
                    />
                  ) : null}
                </View>
              )}

              {error ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: c.errorSurface,
                      borderColor: c.error,
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: c.error }]}>
                    {error}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  paddingBottom: insets.bottom + spacing.md,
                  borderTopColor: c.hairline,
                  backgroundColor: c.background,
                },
              ]}
            >
              {step < 2 ? (
                <Button
                  label="Continue"
                  onPress={goNext}
                  size="lg"
                  fullWidth
                  variant="primary"
                />
              ) : (
                <Button
                  label="Post listing"
                  onPress={handleSubmit}
                  size="lg"
                  fullWidth
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                />
              )}
            </View>

            {showSuccess ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.successOverlay,
                  {
                    opacity: successOpacity,
                    backgroundColor: theme.dark
                      ? "rgba(10,10,11,0.85)"
                      : "rgba(255,255,255,0.92)",
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.successBadge,
                    {
                      backgroundColor: c.success,
                      transform: [{ scale: successScale }],
                    },
                  ]}
                >
                  <Check size={36} color="#FFFFFF" strokeWidth={2.5} />
                </Animated.View>
                <Text
                  style={{
                    marginTop: spacing.md,
                    color: c.textPrimary,
                    fontFamily: t.headline.fontFamily,
                    fontSize: t.headline.fontSize,
                    fontWeight: "600",
                  }}
                >
                  Listing posted
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheet: {
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      overflow: "hidden",
    },
    grabberWrap: {
      alignItems: "center",
      paddingTop: spacing.sm,
    },
    grabber: {
      width: 40,
      height: 5,
      borderRadius: radius.full,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    stepDots: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    stepDot: {
      height: 8,
      borderRadius: radius.full,
      borderWidth: StyleSheet.hairlineWidth,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
    stepTitle: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: t.title.fontSize,
      lineHeight: t.title.lineHeight,
      letterSpacing: t.title.letterSpacing,
      fontWeight: t.title.fontWeight,
    },
    stepHelper: {
      color: c.textSecondary,
      fontFamily: t.body.fontFamily,
      fontSize: t.body.fontSize,
      lineHeight: t.body.lineHeight,
    },
    photoBox: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderStyle: "dashed",
      overflow: "hidden",
    },
    photoPreview: { width: "100%", height: "100%" },
    photoEmpty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      padding: spacing.xl,
    },
    photoIconFrame: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    photoLabel: {
      color: c.textPrimary,
      fontFamily: t.headline.fontFamily,
      fontSize: t.headline.fontSize,
      fontWeight: "600",
    },
    photoHint: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: t.caption.fontSize,
      textAlign: "center",
    },
    fieldGroupLabel: {
      color: c.textSecondary,
      fontFamily: t.label.fontFamily,
      fontSize: 12,
      letterSpacing: 0.1,
      fontWeight: "500",
      marginTop: spacing.sm,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    toggleLabel: {
      color: c.textPrimary,
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 15,
      fontWeight: "600",
    },
    toggleHelper: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      marginTop: 2,
    },
    errorBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorText: {
      fontFamily: t.body.fontFamily,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    successOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    successBadge: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
