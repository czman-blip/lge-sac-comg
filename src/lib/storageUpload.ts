import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You must be in Edit mode to upload reference images.");
  }
  return {
    "Authorization": `Bearer ${token}`,
    "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

/**
 * Upload a base64 image to Supabase Storage via edge function
 * Returns the public URL
 */
export const uploadReferenceImage = async (base64Data: string, fileName: string): Promise<string> => {
  // Convert base64 to blob
  const response = await fetch(base64Data);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("fileName", fileName);

  const headers = await getAuthHeaders();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-reference-image`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.url;
};

/**
 * Delete a reference image from storage
 */
export const deleteReferenceImage = async (url: string): Promise<void> => {
  // Extract path from URL
  const bucketPath = "/storage/v1/object/public/reference-images/";
  const idx = url.indexOf(bucketPath);
  if (idx === -1) return; // Not a storage URL, skip

  const path = decodeURIComponent(url.substring(idx + bucketPath.length));

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  };

  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-reference-image`, {
    method: "DELETE",
    body: JSON.stringify({ path }),
    headers,
  });

  if (!res.ok) {
    console.error("Failed to delete image from storage");
  }
};

/**
 * Check if a URL is a storage URL (not base64)
 */
export const isStorageUrl = (url: string): boolean => {
  return url.startsWith("http://") || url.startsWith("https://");
};
