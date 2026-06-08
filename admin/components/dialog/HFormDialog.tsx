'use client';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import type { ReactNode } from 'react';
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';
import { HForm } from '@/components/form';

type HFormDialogMode = 'add' | 'edit';

type HFormDialogProps<T extends FieldValues> = {
  open: boolean;
  mode?: HFormDialogMode;

  title?: string;
  description?: ReactNode;

  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  onClose: () => void;

  children: ReactNode;

  loading?: boolean;
  disabled?: boolean;

  submitText?: string;
  cancelText?: string;

  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  formId?: string;

  actionsLeft?: ReactNode;

  contentSx?: SxProps<Theme>;
};

function getDefaultTitle(mode: HFormDialogMode) {
  if (mode === 'edit') return 'Cập nhật thông tin';

  return 'Thêm mới thông tin';
}

function getDefaultSubmitText(mode: HFormDialogMode) {
  if (mode === 'edit') return 'Cập nhật';

  return 'Thêm mới';
}

export function HFormDialog<T extends FieldValues>({
  open,
  mode = 'add',

  title,
  description,

  methods,
  onSubmit,
  onClose,

  children,

  loading = false,
  disabled = false,

  submitText,
  cancelText = 'Hủy',

  maxWidth = 'sm',
  formId = 'h-form-dialog',

  actionsLeft,

  contentSx,
}: HFormDialogProps<T>) {
  function handleClose() {
    if (loading) return;

    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={maxWidth}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
          },
        },
      }}
    >
      <HForm
        id={formId}
        methods={methods}
        onSubmit={onSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
          }}
        >
          <Typography
            component="div"
            variant="h6"
            sx={{
              fontWeight: 800,
            }}
          >
            {title || getDefaultTitle(mode)}
          </Typography>

          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 2.5,
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
            ...contentSx,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {children}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box>{actionsLeft}</Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
            >
              {cancelText}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading || disabled}
              sx={{
                minWidth: 120,
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                submitText || getDefaultSubmitText(mode)
              )}
            </Button>
          </Box>
        </DialogActions>
      </HForm>
    </Dialog>
  );
}