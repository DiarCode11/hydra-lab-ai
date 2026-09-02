import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipe file tidak didukung. Gunakan PNG, JPG, WEBP, atau GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB." },
        { status: 400 }
      );
    }

    const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${randomUUID()}.${extension}`;

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/api/uploads/${filename}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
