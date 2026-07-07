"use client";

import { Alert } from "@mui/material";
import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

import type {
  CompanyItem,
  CompanyStatus,
} from "@/api/companies.api";
import { HFormDialog } from "@/components/dialog";
import {
  HDocumentUpload,
  HDropdown,
  HInput,
} from "@/components/form";

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

  businessRegistrationNumber: string;
  businessRegistrationIssuedDate: string;
  businessRegistrationIssuedPlace: string;
  businessRegistrationDocuments: string[];
};

type CompanyFormDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: CompanyItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: SubmitHandler<CompanyFormValues>;
};

const defaultValues: CompanyFormValues = {
  code: "",
  name: "",
  phone: "",
  email: "",
  taxCode: "",
  representativeName: "",
  address: "",
  status: "ACTIVE",
  note: "",

  businessRegistrationNumber: "",
  businessRegistrationIssuedDate: "",
  businessRegistrationIssuedPlace: "",
  businessRegistrationDocuments: [],
};

export function CompanyFormDialog({
  open,
  mode,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: CompanyFormDialogProps) {
  const methods = useForm<CompanyFormValues>({
    defaultValues,
  });

  const isOwnerOperator =
    mode === "edit" &&
    initialValues?.companyType === "OWNER_OPERATOR";

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialValues) {
      methods.reset({
        code: initialValues.code || "",
        name: initialValues.name || "",
        phone: initialValues.phone || "",
        email: initialValues.email || "",
        taxCode: initialValues.taxCode || "",
        representativeName:
          initialValues.representativeName || "",
        address: initialValues.address || "",
        status: initialValues.status || "ACTIVE",
        note: initialValues.note || "",

        businessRegistrationNumber:
          initialValues.businessRegistrationNumber || "",

        businessRegistrationIssuedDate:
          initialValues.businessRegistrationIssuedDate || "",

        businessRegistrationIssuedPlace:
          initialValues.businessRegistrationIssuedPlace || "",

        businessRegistrationDocuments:
          initialValues.businessRegistrationDocuments || [],
      });

      return;
    }

    methods.reset({
      ...defaultValues,
      businessRegistrationDocuments: [],
    });
  }, [
    open,
    mode,
    initialValues,
    methods,
  ]);

  return (
    <HFormDialog<CompanyFormValues>
      open={open}
      mode={mode}
      title={
        mode === "add"
          ? "Thêm nhà xe"
          : isOwnerOperator
            ? "Cập nhật đơn vị kinh doanh chủ xe"
            : "Cập nhật nhà xe"
      }
      description={
        mode === "add"
          ? "Tạo hồ sơ nhà xe và giấy đăng ký kinh doanh."
          : "Cập nhật thông tin hồ sơ và giấy đăng ký kinh doanh."
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={
        mode === "add"
          ? "Tạo nhà xe"
          : "Lưu thay đổi"
      }
      maxWidth="md"
    >
      {isOwnerOperator && (
        <Alert
          severity="info"
          sx={{
            gridColumn: {
              xs: "auto",
              md: "1 / -1",
            },
          }}
        >
          Đây là đơn vị kinh doanh độc lập của tài xế chủ xe.
          Thông tin giấy đăng ký kinh doanh cập nhật tại đây cũng
          sẽ được hiển thị trong hồ sơ của tài xế chủ sở hữu.
        </Alert>
      )}

      <HInput<CompanyFormValues>
        name="code"
        label={
          isOwnerOperator
            ? "Mã đơn vị"
            : "Mã nhà xe"
        }
        disabled={isOwnerOperator}
        helperText={
          isOwnerOperator
            ? "Không thể thay đổi mã đơn vị của tài xế chủ xe."
            : undefined
        }
        rules={{
          required: "Vui lòng nhập mã nhà xe",
        }}
      />

      <HInput<CompanyFormValues>
        name="name"
        label={
          isOwnerOperator
            ? "Tên đơn vị kinh doanh"
            : "Tên nhà xe"
        }
        rules={{
          required: isOwnerOperator
            ? "Vui lòng nhập tên đơn vị kinh doanh"
            : "Vui lòng nhập tên nhà xe",
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
            label: "Hoạt động",
            value: "ACTIVE",
          },
          {
            label: "Ngưng hoạt động",
            value: "INACTIVE",
          },
        ]}
        rules={{
          required: "Vui lòng chọn trạng thái",
        }}
      />

      <HInput<CompanyFormValues>
        name="businessRegistrationNumber"
        label="Số đăng ký kinh doanh"
        rules={{
          required:
            "Vui lòng nhập số đăng ký kinh doanh",
        }}
      />

      <HInput<CompanyFormValues>
        name="businessRegistrationIssuedDate"
        label="Ngày cấp đăng ký kinh doanh"
        type="date"
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
      />

      <HInput<CompanyFormValues>
        name="businessRegistrationIssuedPlace"
        label="Nơi cấp đăng ký kinh doanh"
        rules={{
          required:
            "Vui lòng nhập nơi cấp đăng ký kinh doanh",
        }}
        sx={{
          gridColumn: {
            xs: "auto",
            md: "1 / -1",
          },
        }}
      />

      <HInput<CompanyFormValues>
        name="address"
        label={
          isOwnerOperator
            ? "Địa chỉ đơn vị kinh doanh"
            : "Địa chỉ nhà xe"
        }
        multiline
        rows={2}
        sx={{
          gridColumn: {
            xs: "auto",
            md: "1 / -1",
          },
        }}
      />

      <HDocumentUpload<CompanyFormValues>
        name="businessRegistrationDocuments"
        label="Giấy đăng ký kinh doanh"
        required
        maxFiles={10}
        maxFileSizeMb={10}
        helperText="Chấp nhận JPG, PNG, WEBP hoặc PDF. Tối đa 10MB mỗi file."
      />

      <HInput<CompanyFormValues>
        name="note"
        label="Ghi chú"
        multiline
        rows={2}
        sx={{
          gridColumn: {
            xs: "auto",
            md: "1 / -1",
          },
        }}
      />
    </HFormDialog>
  );
}