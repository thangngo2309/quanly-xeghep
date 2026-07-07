"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import type {
  UserItem,
  UserRole,
  UserStatus,
} from "@/api/users.api";
import { HFormDialog } from "@/components/dialog";
import {
  HAutocomplete,
  HDocumentUpload,
  HDropdown,
  HInput,
} from "@/components/form";

export type DriverAccountType =
  | "COMPANY_DRIVER"
  | "OWNER_OPERATOR";

export type UserFormValues = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;

  driverAccountType: DriverAccountType;

  driverLicenseDocuments: string[];

  ownerCompanyCode: string;
  ownerCompanyName: string;
  ownerTaxCode: string;
  ownerRepresentativeName: string;
  ownerAddress: string;

  ownerBusinessRegistrationNumber: string;
  ownerBusinessRegistrationIssuedDate: string;
  ownerBusinessRegistrationIssuedPlace: string;
  ownerBusinessRegistrationDocuments: string[];
};

export type CompanyOption = {
  label: string;
  value: string;
};

type UserFormDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  initialValues?: UserItem | null;
  loading?: boolean;
  currentRole?: UserRole | null;
  companyOptions?: CompanyOption[];

  onClose: () => void;
  onSubmit: SubmitHandler<UserFormValues>;
};

const defaultValues: UserFormValues = {
  fullName: "",
  phone: "",
  email: "",
  password: "",

  role: "ADMIN",
  status: "ACTIVE",
  companyId: "",

  driverAccountType: "COMPANY_DRIVER",

  driverLicenseDocuments: [],

  ownerCompanyCode: "",
  ownerCompanyName: "",
  ownerTaxCode: "",
  ownerRepresentativeName: "",
  ownerAddress: "",

  ownerBusinessRegistrationNumber: "",
  ownerBusinessRegistrationIssuedDate: "",
  ownerBusinessRegistrationIssuedPlace: "",
  ownerBusinessRegistrationDocuments: [],
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

  const watchedRole = methods.watch("role");
  const watchedDriverAccountType = methods.watch(
    "driverAccountType",
  );

  const isCompanyAdmin = currentRole === "ADMIN";

  /**
   * Chỉ hiển thị lựa chọn loại tài xế khi thêm mới
   * bằng tài khoản Super Admin.
   */
  const shouldShowDriverAccountType =
    mode === "add" &&
    !isCompanyAdmin &&
    watchedRole === "DRIVER";

  /**
   * Thêm mới tài xế chủ xe.
   */
  const isCreatingOwnerOperator =
    mode === "add" &&
    watchedRole === "DRIVER" &&
    watchedDriverAccountType === "OWNER_OPERATOR";

  /**
   * Chỉnh sửa tài xế là chủ sở hữu của chính
   * company OWNER_OPERATOR đang gắn với user.
   */
  const isEditingOwnerOperator =
    mode === "edit" &&
    initialValues?.role === "DRIVER" &&
    initialValues.company?.companyType ===
      "OWNER_OPERATOR" &&
    initialValues.company.ownerUserId ===
      initialValues.id;

  /**
   * Dùng chung cho cả create và edit.
   */
  const isOwnerOperator =
    isCreatingOwnerOperator ||
    isEditingOwnerOperator;

  const shouldShowOwnerCompanySection =
    isOwnerOperator;

  /**
   * Không hiển thị chọn nhà xe khi:
   * - Người thao tác là Admin nhà xe;
   * - Role là Super Admin;
   * - User là tài xế chủ xe.
   */
  const shouldShowCompany =
    !isCompanyAdmin &&
    watchedRole !== "SUPER_ADMIN" &&
    !isOwnerOperator;

  const isCompanyRequired =
    watchedRole === "ADMIN" ||
    watchedRole === "DRIVER";

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialValues) {
      const editingOwnerOperator =
        initialValues.role === "DRIVER" &&
        initialValues.company?.companyType ===
          "OWNER_OPERATOR" &&
        initialValues.company.ownerUserId ===
          initialValues.id;

      methods.reset({
        ...defaultValues,

        fullName:
          initialValues.fullName || "",
        phone: initialValues.phone || "",
        email: initialValues.email || "",
        password: "",

        role: isCompanyAdmin
          ? "DRIVER"
          : initialValues.role,

        status: initialValues.status,

        companyId:
          initialValues.companyId ||
          initialValues.company?.id ||
          "",

        driverAccountType:
          editingOwnerOperator
            ? "OWNER_OPERATOR"
            : "COMPANY_DRIVER",

        driverLicenseDocuments:
          initialValues.driverLicenseDocuments ||
          [],

        ownerCompanyCode:
          initialValues.company?.code || "",

        ownerCompanyName:
          initialValues.company?.name || "",

        ownerTaxCode:
          initialValues.company?.taxCode || "",

        ownerRepresentativeName:
          initialValues.company
            ?.representativeName || "",

        ownerAddress:
          initialValues.company?.address || "",

        ownerBusinessRegistrationNumber:
          initialValues.company
            ?.businessRegistrationNumber || "",

        ownerBusinessRegistrationIssuedDate:
          initialValues.company
            ?.businessRegistrationIssuedDate ||
          "",

        ownerBusinessRegistrationIssuedPlace:
          initialValues.company
            ?.businessRegistrationIssuedPlace ||
          "",

        ownerBusinessRegistrationDocuments:
          initialValues.company
            ?.businessRegistrationDocuments ||
          [],
      });

      return;
    }

    methods.reset({
      ...defaultValues,
      role: isCompanyAdmin
        ? "DRIVER"
        : "ADMIN",
    });
  }, [
    open,
    mode,
    initialValues,
    methods,
    isCompanyAdmin,
  ]);

  /**
   * Super Admin không thuộc nhà xe.
   */
  useEffect(() => {
    if (watchedRole !== "SUPER_ADMIN") {
      return;
    }

    methods.setValue("companyId", "");
    methods.setValue(
      "driverAccountType",
      "COMPANY_DRIVER",
    );
  }, [watchedRole, methods]);

  /**
   * Khi thêm mới tài xế chủ xe thì company
   * sẽ được backend tạo tự động.
   */
  useEffect(() => {
    if (
      mode !== "add" ||
      watchedDriverAccountType !==
        "OWNER_OPERATOR"
    ) {
      return;
    }

    methods.setValue("companyId", "");
  }, [
    mode,
    watchedDriverAccountType,
    methods,
  ]);

  return (
    <HFormDialog<UserFormValues>
      open={open}
      mode={mode}
      title={
        mode === "add"
          ? "Thêm người dùng"
          : "Cập nhật người dùng"
      }
      description={
        mode === "add"
          ? "Tạo tài khoản quản trị, tài xế thuộc nhà xe hoặc tài xế chủ xe kinh doanh độc lập."
          : "Cập nhật thông tin tài khoản và giấy tờ của người dùng."
      }
      methods={methods}
      onSubmit={onSubmit}
      onClose={onClose}
      loading={loading}
      submitText={
        mode === "add"
          ? isCreatingOwnerOperator
            ? "Tạo tài xế và đơn vị kinh doanh"
            : "Tạo tài khoản"
          : "Lưu thay đổi"
      }
      maxWidth="md"
    >
      <HInput<UserFormValues>
        name="fullName"
        label="Họ và tên"
        rules={{
          required:
            "Vui lòng nhập họ và tên",
        }}
      />

      <HInput<UserFormValues>
        name="phone"
        label="Số điện thoại"
        rules={{
          required:
            "Vui lòng nhập số điện thoại",
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
              label: "Tài xế",
              value: "DRIVER",
            },
          ]}
          rules={{
            required:
              "Vui lòng chọn vai trò",
          }}
        />
      ) : (
        <HDropdown<UserFormValues>
          name="role"
          label="Vai trò"
          disabled={isEditingOwnerOperator}
          options={[
            {
              label: "System Admin",
              value: "SUPER_ADMIN",
            },
            {
              label: "Admin nhà xe",
              value: "ADMIN",
            },
            {
              label: "Tài xế",
              value: "DRIVER",
            },
          ]}
          helperText={
            isEditingOwnerOperator
              ? "Không thể thay đổi vai trò của tài xế chủ xe tại màn hình này."
              : undefined
          }
          rules={{
            required:
              "Vui lòng chọn vai trò",
          }}
        />
      )}

      <HDropdown<UserFormValues>
        name="status"
        label="Trạng thái"
        options={[
          {
            label: "Hoạt động",
            value: "ACTIVE",
          },
          {
            label: "Không hoạt động",
            value: "INACTIVE",
          },
          {
            label: "Đã khóa",
            value: "BLOCKED",
          },
        ]}
        rules={{
          required:
            "Vui lòng chọn trạng thái",
        }}
      />

      {shouldShowDriverAccountType && (
        <HDropdown<UserFormValues>
          name="driverAccountType"
          label="Loại tài xế"
          options={[
            {
              label:
                "Tài xế thuộc nhà xe",
              value: "COMPANY_DRIVER",
            },
            {
              label:
                "Tài xế chủ xe, kinh doanh độc lập",
              value: "OWNER_OPERATOR",
            },
          ]}
          helperText={
            watchedDriverAccountType ===
            "COMPANY_DRIVER"
              ? "Tài xế phải được gắn vào một nhà xe."
              : "Hệ thống sẽ tạo đồng thời tài xế và đơn vị vận tải riêng."
          }
          rules={{
            required:
              "Vui lòng chọn loại tài xế",
          }}
          sx={{
            gridColumn: {
              xs: "auto",
              md: "1 / -1",
            },
          }}
        />
      )}

      {shouldShowCompany && (
        <HAutocomplete<UserFormValues>
          name="companyId"
          label="Nhà xe"
          placeholder="Chọn nhà xe"
          options={companyOptions}
          disabled={
            companyOptions.length === 0
          }
          helperText={
            companyOptions.length === 0
              ? "Chưa có nhà xe hoạt động để chọn"
              : "Tài xế và tài khoản quản trị phải thuộc một nhà xe."
          }
          rules={
            isCompanyRequired
              ? {
                  required:
                    "Vui lòng chọn nhà xe",
                }
              : undefined
          }
          sx={{
            gridColumn: {
              xs: "auto",
              md: "1 / -1",
            },
          }}
        />
      )}

      {watchedRole === "DRIVER" && (
        <HDocumentUpload<UserFormValues>
          name="driverLicenseDocuments"
          label="Giấy phép lái xe"
          required
          maxFiles={6}
          maxFileSizeMb={10}
          helperText="Chấp nhận JPG, PNG, WEBP hoặc PDF. Tối đa 10MB mỗi file."
        />
      )}

      {shouldShowOwnerCompanySection && (
        <>
          <HInput<UserFormValues>
            name="ownerCompanyName"
            label="Tên đơn vị kinh doanh"
            placeholder="Ví dụ: Hộ kinh doanh Nguyễn Văn A"
            rules={{
              required:
                "Vui lòng nhập tên đơn vị kinh doanh",
            }}
            sx={{
              gridColumn: {
                xs: "auto",
                md: "1 / -1",
              },
            }}
          />

          <HInput<UserFormValues>
            name="ownerCompanyCode"
            label="Mã đơn vị"
            disabled={mode === "edit"}
            placeholder="Để trống để hệ thống tự sinh"
            helperText={
              mode === "edit"
                ? "Mã đơn vị không được thay đổi tại màn hình người dùng."
                : "Để trống để hệ thống tự sinh mã đơn vị."
            }
          />

          <HInput<UserFormValues>
            name="ownerTaxCode"
            label="Mã số thuế"
            placeholder="Nhập mã số thuế"
          />

          <HInput<UserFormValues>
            name="ownerRepresentativeName"
            label="Người đại diện"
            placeholder="Để trống sẽ sử dụng tên tài xế"
          />

          <HInput<UserFormValues>
            name="ownerBusinessRegistrationNumber"
            label="Số đăng ký kinh doanh"
            rules={{
              required:
                "Vui lòng nhập số đăng ký kinh doanh",
            }}
          />

          <HInput<UserFormValues>
            name="ownerBusinessRegistrationIssuedDate"
            label="Ngày cấp đăng ký kinh doanh"
            type="date"
          />

          <HInput<UserFormValues>
            name="ownerBusinessRegistrationIssuedPlace"
            label="Nơi cấp đăng ký kinh doanh"
            sx={{
              gridColumn: {
                xs: "auto",
                md: "1 / -1",
              },
            }}
          />

          <HInput<UserFormValues>
            name="ownerAddress"
            label="Địa chỉ đơn vị kinh doanh"
            multiline
            minRows={2}
            sx={{
              gridColumn: {
                xs: "auto",
                md: "1 / -1",
              },
            }}
          />

          <HDocumentUpload<UserFormValues>
            name="ownerBusinessRegistrationDocuments"
            label="Giấy đăng ký kinh doanh"
            required
            maxFiles={10}
            maxFileSizeMb={10}
            helperText="Chấp nhận JPG, PNG, WEBP hoặc PDF. Tài liệu này chỉ được chỉnh sửa tại đây đối với tài xế là chủ đơn vị kinh doanh."
          />
        </>
      )}

      <HInput<UserFormValues>
        name="password"
        label={
          mode === "add"
            ? "Mật khẩu"
            : "Mật khẩu mới"
        }
        type="password"
        helperText={
          mode === "edit"
            ? "Để trống nếu không muốn đổi mật khẩu"
            : "Tối thiểu 6 ký tự"
        }
        rules={
          mode === "add"
            ? {
                required:
                  "Vui lòng nhập mật khẩu",
                minLength: {
                  value: 6,
                  message:
                    "Mật khẩu tối thiểu 6 ký tự",
                },
              }
            : {
                minLength: {
                  value: 6,
                  message:
                    "Mật khẩu tối thiểu 6 ký tự",
                },
              }
        }
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