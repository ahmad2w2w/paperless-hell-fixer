export type StoredFile = {
  relativePath: string; // e.g. uploads/userId/file.pdf
  absolutePath: string;
  originalFilename: string;
  mimetype: string;
  sizeBytes: number;
};

export interface StorageProvider {
  saveUploadedFile(params: {
    userId: string;
    documentId: string;
    file: File;
  }): Promise<StoredFile>;
}


