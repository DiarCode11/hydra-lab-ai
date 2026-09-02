import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

interface UploadRouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(_request: Request, { params }: UploadRouteContext) {
  const { filename } = await params;

  if (path.basename(filename) !== filename) {
    return NextResponse.json({ error: "Nama file tidak valid." }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
  const filePath = path.join(uploadDir, filename);
  const extension = path.extname(filename).slice(1).toLowerCase();
  const contentType = MIME_BY_EXTENSION[extension];

  if (!contentType) {
    return NextResponse.json({ error: "Tipe file tidak didukung." }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });
  }
}