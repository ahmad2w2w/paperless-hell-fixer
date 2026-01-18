import { LocalStorageProvider } from "@/lib/storage/local";
import type { StorageProvider } from "@/lib/storage/types";

export function getStorage(): StorageProvider {
  // MVP: local filesystem storage. Swap with S3 later by returning a different provider.
  return new LocalStorageProvider();
}


