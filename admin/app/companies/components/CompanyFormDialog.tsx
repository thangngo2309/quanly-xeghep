'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import type { CompanyItem, CompanyStatus } from '@/api/companies.api';
import { HFormDialog } from '@/components/dialog';
import { HDropdown, HInput } from '@/components/form';

export type CompanyFormValues = {
  code: string;
  name: string;
  phone: string;
  email: string;
  taxCode: string;
  representativeName: string;
  address: string;
  status: CompanyStatus;
  note: string;
};

type CompanyFormDialogProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues?: CompanyItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<CompanyFormValues>;
};

const defaultValues: CompanyFormValues = {
  code: '',
  name: '',
  phone: '',
  email: '',
  taxCode: '',
  representativeName: '',
  address: '',
  status: 'ACTIVE',
  note: '',
};

export function CompanyFormDialog({
  open,
  mode,
  initialValues,
  loading,
  onClose,
  onSubmit,
}: CompanyFormDialogProps) {
  const methods = useForm<CompanyFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      methods.reset({
        code: initialValues.code || '',
        name: initialValues.name || '',
        phone: initialValues.phone || '',
        email: initialValues.email || '',
        taxCode: initialValues.taxCode || '',
        representativeName: initialValues.representativeName || '',
        address: initialValues.address || '',
        status: initialValues.status || 'ACTIVE',
        note: initialValues.note || '',
      });

      return;
    }

    methods.reset(defaultValues);
  }, [open, mode, initialValues, methods]);

  return (
    <HFormDialog<CompanyFormValues>
      open={open}
      mode={mode}
      title={mode === 'add' ? 'Thêm nhà xe' : 'Cập nhật nhà xe'}
      description={
        mode === 'add'
          ? 'Tạo thông tin nhà xe mới để quản lý tài xế, xe và chuyến.'
          : 'Cập nhật thông tin hồ sơ nhà xe.'
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={mode === 'add' ? 'Tạo nhà xe' : 'Lưu thay đổi'}
      maxWidth="md"
    >
      <HInput<CompanyFormValues>
        name="code"
        label="Mã nhà xe"
        rules={{
          required: 'Vui lòng nhập mã nhà xe',
        }}
      />

      <HInput<CompanyFormValues>
        name="name"
        label="Tên nhà xe"
        rules={{
          required: 'Vui lòng nhập tên nhà xe',
        }}
      />

      <HInput<CompanyFormValues>
        name="phone"
        label="Số điện thoại"
      />

      <HInput<CompanyFormValues>
        name="email"
        label="Email"
        type="email"
      />

      <HInput<CompanyFormValues>
        name="taxCode"
        label="Mã số thuế"
      />

      <HInput<CompanyFormValues>
        name="representativeName"
        label="Người đại diện"
      />

      <HDropdown<CompanyFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: 'Hoạt động',
            value: 'ACTIVE',
          },
          {
            label: 'Ngưng hoạt động',
            value: 'INACTIVE',
          },
        ]}
        rules={{
          required: 'Vui lòng chọn trạng thái',
        }}
      />

      <HInput<CompanyFormValues>
        name="address"
        label="Địa chỉ"
        multiline
        rows={2}
        sx={{
          gridColumn: {
            xs: 'auto',
            md: '1 / -1',
          },
        }}
      />

      <HInput<CompanyFormValues>
        name="note"
        label="Ghi chú"
        multiline
        rows={2}
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