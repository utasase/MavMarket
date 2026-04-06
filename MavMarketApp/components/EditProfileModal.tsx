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
import { useTheme } from "../lib/ThemeContext";

interface Props {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({ visible, profile, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;

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
        <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: c.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.borderLight }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={c.textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: c.accent }, saving && styles.saveBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={c.background} size="small" />
              ) : (
                <Text style={[styles.saveBtnText, { color: c.background }]}>Save</Text>
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
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.border }]}>
                    <Text style={[styles.avatarInitial, { color: c.textSecondary }]}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraOverlay, { backgroundColor: c.accent }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator color={c.background} size="small" />
                  ) : (
                    <Camera size={16} color={c.background} strokeWidth={1.5} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={[styles.changePhotoText, { color: c.accent }]}>Change Photo</Text>
            </View>

            {/* Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={c.textTertiary}
                maxLength={60}
              />
            </View>

            {/* Bio */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell buyers something about yourself..."
                placeholderTextColor={c.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={160}
              />
            </View>

            {/* Major */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Major</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                value={major}
                onChangeText={setMajor}
                placeholder="e.g. Computer Science"
                placeholderTextColor={c.textTertiary}
                maxLength={80}
              />
            </View>

            {/* Year */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Year</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
                value={year}
                onChangeText={setYear}
                placeholder="e.g. Junior"
                placeholderTextColor={c.textTertiary}
                maxLength={40}
              />
            </View>

            {error ? <Text style={[styles.errorText, { color: c.error }]}>{error}</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 14, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, gap: 20, paddingBottom: 40 },
  avatarSection: { alignItems: "center", gap: 8 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 32 },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: { fontSize: 13 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 13, textAlign: "center" },
});
