import fs from "node:fs/promises";
import path from "node:path";
import { StorageProvider, StoredFile } from "@/lib/storage/types";

function safeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

export class LocalStorageProvider implements StorageProvider {
  private rootDir: string;

  constructor(rootDir = path.join(process.cwd(), "uploads")) {
    this.rootDir = rootDir;
  }

  async saveUploadedFile(params: {
    userId: string;
    documentId: string;
    file: File;
  }): Promise<StoredFile> {
    const { userId, documentId, file } = params;
    const buf = Buffer.from(await file.arrayBuffer());

    const originalFilename = file.name || "upload";
    const ext = path.extname(originalFilename) || "";
    const base = safeFilename(path.basename(originalFilename, ext));
    const finalName = `${documentId}-${base}${ext}`;

    const relativeDir = path.join("uploads", userId);
    const relativePath = path.join(relativeDir, finalName);
    const absolutePath = path.join(process.cwd(), relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buf);

    return {
      relativePath: relativePath.replace(/\\/g, "/"),
      absolutePath,
      originalFilename,
      mimetype: file.type || "application/octet-stream",
      sizeBytes: buf.length,
    };
  }
}


