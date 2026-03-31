import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Camera, ChevronDown } from "lucide-react-native";
import { categories } from "../data/mockData";
import { createListing } from "../lib/listings";
import { pickAndUploadListingImage } from "../lib/storage";
import { useAuth } from "../lib/auth-context";

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;
const LISTING_CATEGORIES = categories.filter((c) => c !== "All");

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateListingModal({ visible, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(LISTING_CATEGORIES[0]);
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>("Good");
  const [description, setDescription] = useState("");
  const [pickupName, setPickupName] = useState("UTA Campus");
  const [pickupAddress, setPickupAddress] = useState("701 S Nedderman Dr, Arlington, TX 76019");
  const [isOnCampus, setIsOnCampus] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const reset = () => {
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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      setError("");
      const url = await pickAndUploadListingImage();
      if (url) setImageUrl(url);
    } catch (err: any) {
      setError(err.message ?? "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");

    if (!title.trim()) { setError("Title is required."); return; }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { setError("Enter a valid price."); return; }
    if (!imageUrl) { setError("Please add a photo."); return; }

    try {
      setSubmitting(true);
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
      reset();
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={22} color="#111827" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Listing</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.postBtn, submitting && styles.postBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Image picker */}
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading}
              style={styles.imagePicker}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
              ) : uploading ? (
                <ActivityIndicator color="#0064B1" />
              ) : (
                <>
                  <Camera size={28} color="#9CA3AF" strokeWidth={1.5} />
                  <Text style={styles.imagePickerText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What are you selling?"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Price */}
            <View style={styles.field}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickerValue}>{category}</Text>
                <ChevronDown size={16} color="#6B7280" strokeWidth={1.5} />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerDropdown}>
                  {LISTING_CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.pickerOption, category === c && styles.pickerOptionActive]}
                      onPress={() => { setCategory(c); setShowCategoryPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, category === c && styles.pickerOptionTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Condition */}
            <View style={styles.field}>
              <Text style={styles.label}>Condition</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowConditionPicker(!showConditionPicker)}
              >
                <Text style={styles.pickerValue}>{condition}</Text>
                <ChevronDown size={16} color="#6B7280" strokeWidth={1.5} />
              </TouchableOpacity>
              {showConditionPicker && (
                <View style={styles.pickerDropdown}>
                  {CONDITIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.pickerOption, condition === c && styles.pickerOptionActive]}
                      onPress={() => { setCondition(c); setShowConditionPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, condition === c && styles.pickerOptionTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* Pickup location */}
            <View style={styles.field}>
              <Text style={styles.label}>Pickup Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Location name"
                placeholderTextColor="#9CA3AF"
                value={pickupName}
                onChangeText={setPickupName}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Address"
                placeholderTextColor="#9CA3AF"
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>

            {/* On Campus toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.label}>On-campus pickup</Text>
              <Switch
                value={isOnCampus}
                onValueChange={setIsOnCampus}
                trackColor={{ false: "#E5E7EB", true: "#0064B1" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 16, color: "#111827", fontWeight: "600" },
  postBtn: {
    backgroundColor: "#0064B1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 40 },
  imagePicker: {
    height: 180,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePickerText: { fontSize: 14, color: "#9CA3AF" },
  field: { gap: 6 },
  label: { fontSize: 13, color: "#374151", fontWeight: "500" },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  picker: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerValue: { fontSize: 14, color: "#111827" },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 12 },
  pickerOptionActive: { backgroundColor: "#F3F4F6" },
  pickerOptionText: { fontSize: 14, color: "#374151" },
  pickerOptionTextActive: { color: "#111827", fontWeight: "500" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: { fontSize: 13, color: "#EF4444", textAlign: "center" },
});
