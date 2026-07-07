import { http } from './http';

export type UploadedDocumentItem = {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type UploadDocumentsResponse = {
  items: UploadedDocumentItem[];
};

export async function uploadDocumentsApi(
  files: File[],
): Promise<UploadDocumentsResponse> {
  if (!files.length) {
    throw new Error('Vui lòng chọn ít nhất một file');
  }

  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file, file.name);
  });

  const response =
    await http.post<UploadDocumentsResponse>(
      '/uploads/documents',
      formData,
    );

  return response.data;
}