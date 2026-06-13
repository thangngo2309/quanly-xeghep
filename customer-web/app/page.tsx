"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { getApiErrorMessage } from "@/api/http";
import {
  createPublicBookingApi,
  getPublicAvailableTimesApi,
  getPublicRouteLinesApi,
  type PublicAvailableTimeItem,
  type PublicRouteLineItem,
  type RouteDirection,
} from "@/api/public-booking.api";
import GooglePlaceInput from "@/components/GooglePlaceInput";

type PublicBookingFormValues = {
  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  preferredTime: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;
  passengerCount: string;

  pickupAddress: string;
  pickupLat: string;
  pickupLng: string;

  dropoffAddress: string;
  pickupNote: string;
  dropoffNote: string;
  note: string;
};

const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID || "";
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Xe Ghép";

function getTodayDateString() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDefaultValues(): PublicBookingFormValues {
  return {
    routeLineId: "",
    direction: "OUTBOUND",
    travelDate: getTodayDateString(),
    preferredTime: "",

    customerName: "",
    customerPhone: "",
    customerEmail: "",
    passengerCount: "1",

    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",

    dropoffAddress: "",
    pickupNote: "",
    dropoffNote: "",
    note: "",
  };
}

export default function CustomerBookingPage() {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PublicBookingFormValues>({
    defaultValues: getDefaultValues(),
    mode: "onSubmit",
  });

  const [routeLines, setRouteLines] = useState<PublicRouteLineItem[]>([]);
  const [availableTimes, setAvailableTimes] = useState<
    PublicAvailableTimeItem[]
  >([]);

  const [loadingRouteLines, setLoadingRouteLines] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successBookingCode, setSuccessBookingCode] = useState("");

  const watchedRouteLineId = watch("routeLineId");
  const watchedDirection = watch("direction");
  const watchedTravelDate = watch("travelDate");
  const watchedPassengerCount = watch("passengerCount");
  const watchedPreferredTime = watch("preferredTime");

  const selectedRouteLine = useMemo(() => {
    return routeLines.find((item) => item.id === watchedRouteLineId);
  }, [routeLines, watchedRouteLineId]);

  const loadRouteLines = useCallback(async () => {
    if (!COMPANY_ID) {
      setErrorMessage("Chưa cấu hình NEXT_PUBLIC_COMPANY_ID");
      return;
    }

    setLoadingRouteLines(true);
    setErrorMessage("");

    try {
      const data = await getPublicRouteLinesApi(COMPANY_ID);
      setRouteLines(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoadingRouteLines(false);
    }
  }, []);

  useEffect(() => {
    loadRouteLines();
  }, [loadRouteLines]);

  const loadAvailableTimes = useCallback(async () => {
    if (!watchedRouteLineId || !watchedDirection || !watchedTravelDate) {
      setAvailableTimes([]);
      return;
    }

    setLoadingTimes(true);

    try {
      const data = await getPublicAvailableTimesApi({
        routeLineId: watchedRouteLineId,
        direction: watchedDirection,
        travelDate: watchedTravelDate,
        passengerCount: watchedPassengerCount
          ? Number(watchedPassengerCount)
          : 1,
      });

      setAvailableTimes(data.items);

      const exists = data.items.some(
        (item) => item.time === watchedPreferredTime
      );

      if (!exists) {
        setValue("preferredTime", "");
      }
    } catch {
      setAvailableTimes([]);
      setValue("preferredTime", "");
    } finally {
      setLoadingTimes(false);
    }
  }, [
    setValue,
    watchedDirection,
    watchedPassengerCount,
    watchedPreferredTime,
    watchedRouteLineId,
    watchedTravelDate,
  ]);

  useEffect(() => {
    loadAvailableTimes();
  }, [loadAvailableTimes]);

  const onSubmit: SubmitHandler<PublicBookingFormValues> = async (values) => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessBookingCode("");

    try {
      const booking = await createPublicBookingApi({
        companyId: COMPANY_ID,

        routeLineId: values.routeLineId,
        direction: values.direction,
        travelDate: values.travelDate,
        preferredTime: values.preferredTime,

        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        customerEmail: values.customerEmail.trim() || undefined,
        passengerCount: Number(values.passengerCount || 1),

        pickupAddress: values.pickupAddress.trim(),
        pickupLat: values.pickupLat ? Number(values.pickupLat) : undefined,
        pickupLng: values.pickupLng ? Number(values.pickupLng) : undefined,

        dropoffAddress: values.dropoffAddress.trim() || undefined,
        pickupNote: values.pickupNote.trim() || undefined,
        dropoffNote: values.dropoffNote.trim() || undefined,
        note: values.note.trim() || undefined,
      });

      setSuccessBookingCode(booking.bookingCode);

      reset({
        ...getDefaultValues(),
        routeLineId: values.routeLineId,
        direction: values.direction,
        travelDate: values.travelDate,
      });

      await loadAvailableTimes();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #e6f4f1 0%, #f3f7f6 42%, #ffffff 100%)",
        py: { xs: 2, md: 5 },
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.5,
            }}
          >
            {COMPANY_NAME}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.75,
              fontWeight: 800,
            }}
          >
            Đặt xe ghép
          </Typography>

          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Nhập thông tin chuyến đi, hệ thống sẽ tự sắp xếp xe phù hợp.
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                {successBookingCode && (
                  <Alert severity="success">
                    Đặt xe thành công. Mã booking của bạn là{" "}
                    <strong>{successBookingCode}</strong>. Tổng đài sẽ liên hệ
                    xác nhận trong thời gian sớm nhất.
                  </Alert>
                )}

                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="routeLineId"
                      control={control}
                      rules={{
                        required: "Vui lòng chọn tuyến đi",
                      }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          size="small"
                          error={!!errors.routeLineId}
                        >
                          <InputLabel>Tuyến đi</InputLabel>
                          <Select
                            {...field}
                            label="Tuyến đi"
                            disabled={loadingRouteLines}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                              setValue("preferredTime", "");
                            }}
                          >
                            {routeLines.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name}
                              </MenuItem>
                            ))}
                          </Select>

                          <FormHelperText>
                            {errors.routeLineId?.message ||
                              (selectedRouteLine
                                ? `${selectedRouteLine.startPoint || ""} ${
                                    selectedRouteLine.endPoint
                                      ? `→ ${selectedRouteLine.endPoint}`
                                      : ""
                                  }`
                                : "Chọn tuyến xe cần đi")}
                          </FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="direction"
                      control={control}
                      rules={{
                        required: "Vui lòng chọn chiều đi",
                      }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          size="small"
                          error={!!errors.direction}
                        >
                          <InputLabel>Chiều đi</InputLabel>
                          <Select
                            {...field}
                            label="Chiều đi"
                            onChange={(event) => {
                              field.onChange(event.target.value);
                              setValue("preferredTime", "");
                            }}
                          >
                            <MenuItem value="OUTBOUND">Chiều đi</MenuItem>
                            <MenuItem value="RETURN">Chiều về</MenuItem>
                          </Select>
                          <FormHelperText>
                            {errors.direction?.message ||
                              "Chọn chiều tuyến phù hợp"}
                          </FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="travelDate"
                      control={control}
                      rules={{
                        required: "Vui lòng chọn ngày đi",
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Ngày đi"
                          type="date"
                          fullWidth
                          size="small"
                          error={!!errors.travelDate}
                          helperText={
                            errors.travelDate?.message || "Chọn ngày cần đi"
                          }
                          slotProps={{
                            inputLabel: {
                              shrink: true,
                            },
                          }}
                          onChange={(event) => {
                            field.onChange(event.target.value);
                            setValue("preferredTime", "");
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="preferredTime"
                      control={control}
                      rules={{
                        required: "Vui lòng chọn giờ đi",
                      }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          size="small"
                          error={!!errors.preferredTime}
                        >
                          <InputLabel>Giờ đi</InputLabel>
                          <Select
                            {...field}
                            label="Giờ đi"
                            disabled={loadingTimes}
                          >
                            {availableTimes.map((item) => (
                              <MenuItem key={item.time} value={item.time}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            {errors.preferredTime?.message ||
                              (loadingTimes
                                ? "Đang tải giờ đi..."
                                : availableTimes.length > 0
                                ? "Chọn giờ còn ghế"
                                : "Chưa có giờ phù hợp")}
                          </FormHelperText>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="customerName"
                      control={control}
                      rules={{
                        required: "Vui lòng nhập họ tên",
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Tên khách hàng"
                          placeholder="Nhập họ tên"
                          fullWidth
                          size="small"
                          error={!!errors.customerName}
                          helperText={errors.customerName?.message}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="customerPhone"
                      control={control}
                      rules={{
                        required: "Vui lòng nhập số điện thoại",
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Số điện thoại"
                          placeholder="Nhập số điện thoại"
                          fullWidth
                          size="small"
                          error={!!errors.customerPhone}
                          helperText={errors.customerPhone?.message}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="customerEmail"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email"
                          placeholder="Không bắt buộc"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="passengerCount"
                      control={control}
                      rules={{
                        required: "Vui lòng nhập số khách",
                        validate: (value) => {
                          const numberValue = Number(value);

                          if (!Number.isFinite(numberValue)) {
                            return "Số khách không hợp lệ";
                          }

                          if (numberValue < 1) {
                            return "Số khách tối thiểu là 1";
                          }

                          return true;
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Số khách"
                          type="number"
                          fullWidth
                          size="small"
                          error={!!errors.passengerCount}
                          helperText={
                            errors.passengerCount?.message ||
                            "Tối thiểu 1 khách"
                          }
                          slotProps={{
                            htmlInput: {
                              min: 1,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: "span 12" }}>
                    <Controller
                      name="pickupAddress"
                      control={control}
                      rules={{
                        required: "Vui lòng nhập địa điểm đón",
                      }}
                      render={({ field }) => (
                        <GooglePlaceInput
                          label="Địa điểm đón"
                          placeholder="Nhập địa điểm đón khách"
                          required
                          value={field.value}
                          errorText={errors.pickupAddress?.message}
                          helperText="Hệ thống dùng điểm đón để tự ghép xe phù hợp."
                          onChange={(place) => {
                            field.onChange(place.address);

                            setValue(
                              "pickupLat",
                              place.lat !== undefined ? String(place.lat) : "",
                              {
                                shouldDirty: true,
                              }
                            );

                            setValue(
                              "pickupLng",
                              place.lng !== undefined ? String(place.lng) : "",
                              {
                                shouldDirty: true,
                              }
                            );
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: "span 12" }}>
                    <Controller
                      name="dropoffAddress"
                      control={control}
                      render={({ field }) => (
                        <GooglePlaceInput
                          label="Địa điểm trả"
                          placeholder="Nhập địa điểm trả nếu có"
                          value={field.value}
                          helperText="Không bắt buộc. Chỉ lưu thông tin để tài xế tham khảo."
                          onChange={(place) => {
                            field.onChange(place.address);
                          }}
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="pickupNote"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Ghi chú điểm đón"
                          placeholder="Ví dụ: đứng trước cổng, gần quán cafe..."
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                    <Controller
                      name="dropoffNote"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Ghi chú điểm trả"
                          placeholder="Không bắt buộc"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Box>

                  <Box sx={{ gridColumn: "span 12" }}>
                    <Controller
                      name="note"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Ghi chú thêm"
                          placeholder="Không bắt buộc"
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                        />
                      )}
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    height: 48,
                    borderRadius: 999,
                    fontWeight: 900,
                    fontSize: 16,
                    mt: 1,
                  }}
                >
                  {submitting ? "Đang gửi..." : "Đặt xe"}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "text.secondary",
            mt: 2,
          }}
        >
          Sau khi gửi thông tin, tổng đài sẽ liên hệ xác nhận chuyến đi.
        </Typography>
      </Container>
    </Box>
  );
}
