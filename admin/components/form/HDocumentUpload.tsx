"use client";

import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  Typography,
} from "@mui/material";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

import { getApiErrorMessage } from "@/api/http";
import { uploadDocumentsApi } from "@/api/uploads.api";

const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const DEFAULT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

type HDocumentUploadProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;

  helperText?: string;
  required?: boolean;

  maxFiles?: number;
  maxFileSizeMb?: number;

  allowedMimeTypes?: string[];
  accept?: string;

  disabled?: boolean;
};

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6100/api";

  return apiUrl.replace(/\/api\/?$/, "");
}

function resolveFileUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${getApiOrigin()}${url.startsWith("/") ? url : `/${url}`}`;
}

function getFileName(url: string) {
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/");

  return decodeURIComponent(parts[parts.length - 1] || "") || "Tài liệu";
}

function isImageUrl(url: string) {
  const cleanUrl = url.split("?")[0].toLowerCase();

  return (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp")
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function HDocumentUpload<TFieldValues extends FieldValues>({
  name,
  label,
  helperText,
  required = false,
  maxFiles = 6,
  maxFileSizeMb = 10,
  allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
  accept = DEFAULT_ACCEPT,
  disabled = false,
}: HDocumentUploadProps<TFieldValues>) {
  const { control, trigger } = useFormContext<TFieldValues>();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);

  const [dragging, setDragging] = useState(false);

  const [localError, setLocalError] = useState("");

  const maxFileSizeBytes = useMemo(
    () => maxFileSizeMb * 1024 * 1024,
    [maxFileSizeMb]
  );

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => {
          const documents = Array.isArray(value) ? value : [];

          if (required && documents.length === 0) {
            return `Vui lòng tải ${label.toLowerCase()}`;
          }

          if (documents.length > maxFiles) {
            return `Chỉ được tải tối đa ${maxFiles} file`;
          }

          return true;
        },
      }}
      render={({ field, fieldState }) => {
        const documents: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        const processFiles = async (selectedFiles: File[]) => {
          if (disabled || uploading || selectedFiles.length === 0) {
            return;
          }

          setLocalError("");

          if (documents.length + selectedFiles.length > maxFiles) {
            setLocalError(`Tổng số file không được vượt quá ${maxFiles}`);
            return;
          }

          const invalidTypeFile = selectedFiles.find(
            (file) => !allowedMimeTypes.includes(file.type)
          );

          if (invalidTypeFile) {
            setLocalError(
              `File "${invalidTypeFile.name}" không đúng định dạng. Chỉ chấp nhận JPG, PNG, WEBP hoặc PDF.`
            );
            return;
          }

          const oversizedFile = selectedFiles.find(
            (file) => file.size > maxFileSizeBytes
          );

          if (oversizedFile) {
            setLocalError(
              `File "${oversizedFile.name}" vượt quá ${maxFileSizeMb}MB.`
            );
            return;
          }

          setUploading(true);

          try {
            const response = await uploadDocumentsApi(selectedFiles);

            const uploadedUrls = response.items
              .map((item) => item.url)
              .filter(Boolean);

            const nextDocuments = Array.from(
              new Set([...documents, ...uploadedUrls])
            );

            field.onChange(nextDocuments);
            field.onBlur();

            await trigger(name);
          } catch (error) {
            setLocalError(getApiErrorMessage(error));
          } finally {
            setUploading(false);
          }
        };

        const handleInputChange = async (
          event: ChangeEvent<HTMLInputElement>
        ) => {
          const files = Array.from(event.target.files || []);

          event.target.value = "";

          await processFiles(files);
        };

        const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();

          if (disabled || uploading) {
            return;
          }

          setDragging(true);
        };

        const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(false);
        };

        const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(false);

          const files = Array.from(event.dataTransfer.files || []);

          await processFiles(files);
        };

        const handleRemove = async (url: string) => {
          if (disabled || uploading) {
            return;
          }

          const nextDocuments = documents.filter((item) => item !== url);

          field.onChange(nextDocuments);
          field.onBlur();

          await trigger(name);
        };

        return (
          <Box
            sx={{
              gridColumn: {
                xs: "auto",
                md: "1 / -1",
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 0.75,
                fontWeight: 700,
              }}
            >
              {label}
              {required ? " *" : ""}
            </Typography>

            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: "1px dashed",
                borderColor:
                  fieldState.error || localError
                    ? "error.main"
                    : dragging
                    ? "primary.main"
                    : "divider",

                bgcolor: dragging ? "action.hover" : "background.paper",

                borderRadius: 2,
                p: 1.5,
                transition: "border-color 0.2s, background-color 0.2s",
              }}
            >
              <input
                ref={inputRef}
                hidden
                multiple
                type="file"
                accept={accept}
                disabled={disabled || uploading}
                onChange={handleInputChange}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: {
                    xs: "stretch",
                    sm: "center",
                  },
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: 1.25,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  disabled={
                    disabled || uploading || documents.length >= maxFiles
                  }
                  onClick={() => inputRef.current?.click()}
                  sx={{
                    minHeight: 42,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  {uploading ? (
                    <>
                      <CircularProgress size={18} sx={{ mr: 1 }} />
                      Đang tải file
                    </>
                  ) : (
                    "Chọn file"
                  )}
                </Button>

                <Typography variant="body2" color="text.secondary">
                  Kéo thả file vào đây hoặc bấm chọn file. Tối đa {maxFiles}{" "}
                  file, mỗi file không quá {maxFileSizeMb}
                  MB.
                </Typography>
              </Box>

              {documents.length > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1,
                    mt: 1.5,
                  }}
                >
                  {documents.map((url, index) => {
                    const fileUrl = resolveFileUrl(url);

                    return (
                      <Box
                        key={`${url}-${index}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minWidth: 0,
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          bgcolor: "background.default",
                        }}
                      >
                        {isImageUrl(url) ? (
                          <Box
                            component="img"
                            src={fileUrl}
                            alt={getFileName(url)}
                            sx={{
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              borderRadius: 1,
                              objectFit: "cover",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 1,
                              bgcolor: "action.hover",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            PDF
                          </Box>
                        )}

                        <Box
                          sx={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            title={getFileName(url)}
                            sx={{
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {getFileName(url)}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            File {index + 1}/{documents.length}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          <Button
                            component="a"
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            variant="text"
                            sx={{
                              minWidth: "auto",
                            }}
                          >
                            Xem
                          </Button>

                          <Button
                            type="button"
                            size="small"
                            color="error"
                            variant="text"
                            disabled={disabled || uploading}
                            onClick={() => handleRemove(url)}
                            sx={{
                              minWidth: "auto",
                            }}
                          >
                            Xóa
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <FormHelperText
              error={!!fieldState.error || !!localError}
              sx={{ mx: 1.75 }}
            >
              {fieldState.error?.message ||
                localError ||
                helperText ||
                `${documents.length}/${maxFiles} file đã tải`}
            </FormHelperText>
          </Box>
        );
      }}
    />
  );
}
