'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { HDropdown, HInput } from '@/components/form';
import type { UserItem, UserRole, UserStatus } from '@/api/users.api';
import { HFormDialog } from '@/components/dialog';

export type UserFormValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
};

type UserFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: UserItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<UserFormValues>;
};

const defaultValues: UserFormValues = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  role: 'ADMIN',
  status: 'ACTIVE',
};

export function UserFormDialog({
  open,
  mode,
  initialValues,
  loading,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const methods = useForm<UserFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        fullName: initialValues.fullName || '',
        phone: initialValues.phone || '',
        email: initialValues.email || '',
        password: '',
        role: initialValues.role,
        status: initialValues.status,
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<UserFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm người dùng' : 'Cập nhật người dùng'}
      description={
        mode === 'add'
          ? 'Tạo tài khoản cho Super Admin, Admin nhà xe hoặc tài xế.'
          : 'Cập nhật thông tin tài khoản người dùng.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
      maxWidth="sm"
    >
      <HInput<UserFormValues>
        name="fullName"
        label="Họ và tên"
        rules={{
          required: 'Vui lòng nhập họ và tên',
        }}
      />

      <HInput<UserFormValues>
        name="phone"
        label="Số điện thoại"
        rules={{
          required: 'Vui lòng nhập số điện thoại',
        }}
      />

      <HInput<UserFormValues>
        name="email"
        label="Email"
        type="email"
      />

      <HDropdown<UserFormValues>
        name="role"
        label="Vai trò"
        options={[
          {
            label: 'Super Admin',
            value: 'SUPER_ADMIN',
          },
          {
            label: 'Admin',
            value: 'ADMIN',
          },
          {
            label: 'Tài xế',
            value: 'DRIVER',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn vai trò',
        }}
      />

      <HDropdown<UserFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: 'Hoạt động',
            value: 'ACTIVE',
          },
          {
            label: 'Không hoạt động',
            value: 'INACTIVE',
          },
          {
            label: 'Đã khóa',
            value: 'BLOCKED',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn trạng thái',
        }}
      />

      <HInput<UserFormValues>
        name="password"
        label={mode === 'add' ? 'Mật khẩu' : 'Mật khẩu mới'}
        type="password"
        helperText={
          mode === 'edit'
            ? 'Để trống nếu không muốn đổi mật khẩu'
            : 'Tối thiểu 6 ký tự'
        }
        rules={
          mode === 'add'
            ? {
                required: 'Vui lòng nhập mật khẩu',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu tối thiểu 6 ký tự',
                },
              }
            : {
                minLength: {
                  value: 6,
                  message: 'Mật khẩu tối thiểu 6 ký tự',
                },
              }
        }
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />
    </HFormDialog>
  );
}