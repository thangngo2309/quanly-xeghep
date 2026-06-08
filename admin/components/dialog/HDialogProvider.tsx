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
} from '@mui/material';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type HDialogVariant = 'confirm' | 'info' | 'warning' | 'error';

export type HDialogOptions = {
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  onConfirm?: () => void | Promise<void>;
};

type InternalDialogState = {
  open: boolean;
  variant: HDialogVariant;
  title: string;
  message?: ReactNode;
  confirmText: string;
  cancelText: string;
  maxWidth: 'xs' | 'sm' | 'md' | 'lg';
  hideCancel: boolean;
  onConfirm?: () => void | Promise<void>;
};

type HDialogContextValue = {
  confirm: (options: HDialogOptions) => Promise<boolean>;
  info: (options: HDialogOptions) => Promise<boolean>;
  warning: (options: HDialogOptions) => Promise<boolean>;
  error: (options: HDialogOptions) => Promise<boolean>;
  close: () => void;
};  

const HDialogContext = createContext<HDialogContextValue | null>(null);

const defaultState: InternalDialogState = {
  open: false,
  variant: 'info',
  title: '',
  message: '',
  confirmText: 'Đồng ý',
  cancelText: 'Hủy',
  maxWidth: 'xs',
  hideCancel: false,
};

function getDialogStyle(variant: HDialogVariant) {
  switch (variant) {
    case 'confirm':
      return {
        symbol: '?',
        color: '#2563eb',
        bgColor: '#eff6ff',
        confirmColor: 'primary' as const,
      };

    case 'warning':
      return {
        symbol: '!',
        color: '#d97706',
        bgColor: '#fffbeb',
        confirmColor: 'warning' as const,
      };

    case 'error':
      return {
        symbol: '×',
        color: '#dc2626',
        bgColor: '#fef2f2',
        confirmColor: 'error' as const,
      };

    case 'info':
    default:
      return {
        symbol: 'i',
        color: '#0f766e',
        bgColor: '#ecfdf5',
        confirmColor: 'primary' as const,
      };
  }
}

function getDefaultTitle(variant: HDialogVariant) {
  switch (variant) {
    case 'confirm':
      return 'Xác nhận thao tác';

    case 'warning':
      return 'Cảnh báo';

    case 'error':
      return 'Có lỗi xảy ra';

    case 'info':
    default:
      return 'Thông báo';
  }
}

function getDefaultConfirmText(variant: HDialogVariant) {
  switch (variant) {
    case 'confirm':
      return 'Xác nhận';

    case 'warning':
      return 'Đã hiểu';

    case 'error':
      return 'Đóng';

    case 'info':
    default:
      return 'Đồng ý';
  }
}

export function HDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<InternalDialogState>(defaultState);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const openDialog = useCallback(
    (
      variant: HDialogVariant,
      options: HDialogOptions,
      hideCancel: boolean,
    ) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;

        setDialog({
          open: true,
          variant,
          title: options.title || getDefaultTitle(variant),
          message: options.message,
          confirmText: options.confirmText || getDefaultConfirmText(variant),
          cancelText: options.cancelText || 'Hủy',
          maxWidth: options.maxWidth || 'xs',
          hideCancel,
          onConfirm: options.onConfirm,
        });
      });
    },
    [],
  );

  const closeDialog = useCallback(() => {
    setConfirmLoading(false);
    setDialog(defaultState);
  }, []);

  const resolveAndClose = useCallback(
    (value: boolean) => {
      resolverRef.current?.(value);
      resolverRef.current = null;
      closeDialog();
    },
    [closeDialog],
  );

  async function handleConfirm() {
    try {
      if (dialog.onConfirm) {
        setConfirmLoading(true);
        await dialog.onConfirm();
      }

      resolveAndClose(true);
    } catch {
      setConfirmLoading(false);
    }
  }

  function handleCancel() {
    resolveAndClose(false);
  }

  const dialogStyle = getDialogStyle(dialog.variant);

  const value = useMemo<HDialogContextValue>(
    () => ({
      confirm: (options) => openDialog('confirm', options, false),
      info: (options) => openDialog('info', options, true),
      warning: (options) => openDialog('warning', options, true),
      error: (options) => openDialog('error', options, true),
      close: closeDialog,
    }),
    [openDialog, closeDialog],
  );

  return (
    <HDialogContext.Provider value={value}>
      {children}

      <Dialog
        open={dialog.open}
        onClose={confirmLoading ? undefined : handleCancel}
        fullWidth
        maxWidth={dialog.maxWidth}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: dialogStyle.bgColor,
                color: dialogStyle.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {dialogStyle.symbol}
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              {dialog.title}
            </Typography>
          </Box>
        </DialogTitle>

        {dialog.message && (
          <DialogContent sx={{ pt: 1 }}>
            {typeof dialog.message === 'string' ? (
              <Typography
                color="text.secondary"
                sx={{
                  lineHeight: 1.7,
                  textAlign: 'center',
                }}
              >
                {dialog.message}
              </Typography>
            ) : (
              dialog.message
            )}
          </DialogContent>
        )}

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            justifyContent: 'center',
          }}
        >
          {!dialog.hideCancel && (
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={confirmLoading}
              sx={{ minWidth: 110 }}
            >
              {dialog.cancelText}
            </Button>
          )}

          <Button
            variant="contained"
            color={dialogStyle.confirmColor}
            onClick={handleConfirm}
            disabled={confirmLoading}
            sx={{ minWidth: 120 }}
          >
            {confirmLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              dialog.confirmText
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </HDialogContext.Provider>
  );
}

export function useHDialog() {
  const context = useContext(HDialogContext);

  if (!context) {
    throw new Error('useHDialog must be used inside HDialogProvider');
  }

  return context;
}