import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to upload an image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

async function uploadToStorage(userId: string, path: string, uri: string, ext: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("listings")
    .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from("listings").getPublicUrl(path);
  return data.publicUrl;
}

export async function pickAndUploadListingImage(userId: string): Promise<string | null> {
  const asset = await pickImage();
  if (!asset) return null;

  const ext = asset.uri.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  return uploadToStorage(userId, path, asset.uri, ext);
}

export async function pickAndUploadAvatarImage(userId: string): Promise<string | null> {
  const asset = await pickImage();
  if (!asset) return null;

  const ext = asset.uri.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  return uploadToStorage(userId, path, asset.uri, ext);
}
