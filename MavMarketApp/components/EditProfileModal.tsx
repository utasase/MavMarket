import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, ChevronLeft } from "lucide-react-native";
import { type UserProfile, type Theme } from "../lib/types";
import { updateUserProfile } from "../lib/profile";
import { pickAndUploadAvatarImage } from "../lib/storage";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/ThemeContext";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { IconButton } from "./ui/IconButton";
import { spacing, radius } from "../lib/theme";

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
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
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

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sheetHeight = Dimensions.get("window").height * 0.94;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
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
                paddingTop: Math.max(insets.top, spacing.lg),
              },
            ]}
          >
            <View style={styles.grabberWrap}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
            </View>

            <View style={styles.header}>
              <IconButton
                icon={
                  <ChevronLeft
                    size={20}
                    color={c.textPrimary}
                    strokeWidth={1.85}
                  />
                }
                onPress={onClose}
                accessibilityLabel="Close"
                size={40}
              />
              <Text style={styles.headerTitle}>Edit profile</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                  style={styles.avatarWrapper}
                  accessibilityRole="button"
                  accessibilityLabel="Change photo"
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarPlaceholder,
                        { backgroundColor: c.surfaceElevated },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitial,
                          { color: c.textSecondary },
                        ]}
                      >
                        {name.charAt(0).toUpperCase() || "M"}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.cameraOverlay,
                      { backgroundColor: c.accent, borderColor: c.background },
                    ]}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Camera size={14} color="#FFFFFF" strokeWidth={2} />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                >
                  <Text style={[styles.changePhotoText, { color: c.accentLight }]}>
                    {uploadingAvatar ? "Uploading…" : "Change photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldsStack}>
                <Field
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  placeholder="Your name"
                />
                <Field
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  maxLength={160}
                  multiline
                  numberOfLines={3}
                  placeholder="Tell buyers something about yourself"
                  helper={`${bio.length}/160`}
                />
                <Field
                  label="Major"
                  value={major}
                  onChangeText={setMajor}
                  maxLength={80}
                  placeholder="e.g. Computer Science"
                />
                <Field
                  label="Year"
                  value={year}
                  onChangeText={setYear}
                  maxLength={40}
                  placeholder="e.g. Junior"
                />
              </View>

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
                  <Text style={[styles.errorBannerText, { color: c.error }]}>
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
              <Button
                label="Save changes"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
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
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheet: {
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      overflow: "hidden",
    },
    grabberWrap: {
      alignItems: "center",
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    grabber: {
      width: 40,
      height: 4,
      borderRadius: 2,
      opacity: 0.6,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      color: c.textPrimary,
      fontFamily: t.headline.fontFamily,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    avatarSection: {
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    avatarWrapper: {
      position: "relative",
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontFamily: t.title.fontFamily,
      fontSize: 34,
      fontWeight: "700",
    },
    cameraOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    changePhotoText: {
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      fontWeight: "600",
    },
    fieldsStack: {
      gap: spacing.lg,
    },
    errorBanner: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    errorBannerText: {
      fontFamily: t.body.fontFamily,
      fontSize: 13,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  });
}
