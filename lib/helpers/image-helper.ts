import "server-only";
import { readFile } from "fs/promises";
import path from "path";

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Mengubah path gambar lokal (/uploads/xxx.png) menjadi base64 data URL
 * dengan membaca langsung dari disk. Ini menghindari OpenAI harus fetch
 * balik ke server kita (yang gagal untuk URL localhost / belum publik).
 *
 * Jika imageUrl sudah berupa URL absolut (http/https) atau sudah data URL,
 * kembalikan langsung tanpa diproses.
 */
export async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const extension = path.extname(imageUrl).replace(".", "").toLowerCase();
  const mimeType = MIME_BY_EXTENSION[extension] || "application/octet-stream";

  // imageUrl berbentuk "/uploads/xxx.png", map ke folder public/uploads
  const filePath = path.join(process.cwd(), "public", imageUrl);

  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");

  return `data:${mimeType};base64,${base64}`;
}
