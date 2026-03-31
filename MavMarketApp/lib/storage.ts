import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

/**
 * Opens the device image picker, uploads the selected image to Supabase Storage
 * under the "listings" bucket, and returns the public URL.
 * Returns null if the user cancels.
 */
export async function pickAndUploadListingImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library access is required to add a listing image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const ext = asset.uri.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("listings")
    .upload(fileName, blob, { contentType: `image/${ext}` });

  if (error) throw error;

  const { data } = supabase.storage.from("listings").getPublicUrl(fileName);
  return data.publicUrl;
}
