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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Camera } from "lucide-react-native";
import { type UserProfile } from "../data/mockData";
import { updateUserProfile } from "../lib/profile";
import { pickAndUploadAvatarImage } from "../lib/storage";
import { useAuth } from "../lib/auth-context";

interface Props {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ visible, profile, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [major, setMajor] = useState(profile.major);
  const [year, setYear] = useState(profile.year);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync fields when profile changes (e.g. after reload)
  React.useEffect(() => {
    setName(profile.name);
    setBio(profile.bio);
    setMajor(profile.major);
    setYear(profile.year);
    setAvatarUrl(profile.avatar);
  }, [profile]);

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      setError("");
      const url = await pickAndUploadAvatarImage(user!.id);
      if (url) setAvatarUrl(url);
    } catch (err: any) {
      setError(err.message ?? "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Name is required."); return; }

    try {
      setSaving(true);
      setError("");
      await updateUserProfile(user.id, {
        name: name.trim(),
        bio: bio.trim(),
        major: major.trim(),
        year: year.trim(),
        avatar_url: avatarUrl || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#111827" strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar picker */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarWrapper}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  {uploadingAvatar ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Camera size={16} color="#FFFFFF" strokeWidth={1.5} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </View>

            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                maxLength={60}
              />
            </View>

            {/* Bio */}
            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell buyers something about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={160}
              />
            </View>

            {/* Major */}
            <View style={styles.field}>
              <Text style={styles.label}>Major</Text>
              <TextInput
                style={styles.input}
                value={major}
                onChangeText={setMajor}
                placeholder="e.g. Computer Science"
                placeholderTextColor="#9CA3AF"
                maxLength={80}
              />
            </View>

            {/* Year */}
            <View style={styles.field}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="e.g. Junior"
                placeholderTextColor="#9CA3AF"
                maxLength={40}
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
  saveBtn: {
    backgroundColor: "#0064B1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, gap: 20, paddingBottom: 40 },
  avatarSection: { alignItems: "center", gap: 8 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 32, color: "#6B7280" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0064B1",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: { fontSize: 13, color: "#0064B1" },
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
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 13, color: "#EF4444", textAlign: "center" },
});
