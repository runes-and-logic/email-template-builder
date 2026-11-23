import { cloudMode } from "./config";
export async function uploadImage(file: File): Promise<string> {
  if (file.size > 1500000 || !/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error("Choose a PNG, JPEG, WebP or GIF under 1.5 MB.");
  if (cloudMode) {
    const data = new FormData();
    data.set("file", file);
    const response = await fetch("/api/assets", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed.");
    return result.url;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.readAsDataURL(file);
  });
}
