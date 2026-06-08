'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';
import type { UserItem, UserRole, UserStatus } from '@/api/users.api';

export type UserFormValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
};

export type CompanyOption = {
  label: string;
  value: string;
};

type UserFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: UserItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: CompanyOption[];
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
  companyId: '',
};

export function UserFormDialog({
  open,
  mode,
  initialValues,
  loading,
  currentRole,
  companyOptions = [],
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const methods = useForm<UserFormValues>({
    defaultValues,
  });

  const watchedRole = methods.watch('role');
  const isCompanyAdmin = currentRole === 'ADMIN';
  const shouldShowCompany = !isCompanyAdmin && watchedRole !== 'SUPER_ADMIN';

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        fullName: initialValues.fullName || '',
        phone: initialValues.phone || '',
        email: initialValues.email || '',
        password: '',
        role: isCompanyAdmin ? 'DRIVER' : initialValues.role,
        status: initialValues.status,
        companyId: initialValues.company?.id || '',
      });

      return;
    }

    methods.reset({
      ...defaultValues,
      role: isCompanyAdmin ? 'DRIVER' : 'ADMIN',
      companyId: '',
    });
  }, [open, mode, initialValues, methods, isCompanyAdmin]);

  useEffect(() => {
    if (watchedRole === 'SUPER_ADMIN') {
      methods.setValue('companyId', '');
    }
  }, [watchedRole, methods]);

  return (
    <HFormDialog<UserFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm người dùng' : 'Cập nhật người dùng'}
      description={
        mode === 'add'
          ? 'Tạo tài khoản cho System Admin, Admin nhà xe hoặc tài xế.'
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

      {isCompanyAdmin ? (
        <HDropdown<UserFormValues>
          name="role"
          label="Vai trò"
          disabled
          options={[
            {
              label: 'Tài xế',
              value: 'DRIVER',
            },
          ]}
          rules={{
            required: 'Vui lòng chọn vai trò',
          }}
        />
      ) : (
        <HDropdown<UserFormValues>
          name="role"
          label="Vai trò"
          options={[
            {
              label: 'System Admin',
              value: 'SUPER_ADMIN',
            },
            {
              label: 'Admin nhà xe',
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
      )}

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

      {shouldShowCompany && (
        <HDropdown<UserFormValues>
          name="companyId"
          label="Nhà xe"
          placeholder="Chọn nhà xe"
          options={companyOptions}
          disabled={companyOptions.length === 0}
          helperText={
            companyOptions.length === 0
              ? 'Chưa có nhà xe hoạt động để chọn'
              : undefined
          }
          rules={{
            required: 'Vui lòng chọn nhà xe',
          }}
          sx={{
            gridColumn: {
              xs: 'auto',
              md: '1 / -1',
            },
          }}
        />
      )}

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