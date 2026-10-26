import { createClient } from "@/lib/supabase/browser";

const MAX_SIDE = 1600;

/** Reduce imágenes grandes a WebP (conserva transparencia). GIF y SVG se suben tal cual. */
async function shrink(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 400_000) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  return blob && blob.size < file.size ? blob : file;
}

/** Sube un archivo al bucket "media" y devuelve su URL pública. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  const body = await shrink(file).catch(() => file);
  const ext = body.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from("media").upload(path, body, {
    contentType: body.type || file.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
