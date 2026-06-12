"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAvailableBookingTimesApi,
  getDispatchBoardApi,
  moveBookingTripApi,
  type DispatchBoardBookingItem,
  type DispatchBoardTripItem,
} from "@/api/bookings.api";
import { getApiErrorMessage } from "@/api/http";
import { getRouteLinesApi, type RouteDirection } from "@/api/route-lines.api";
import { HAutocomplete, HDatePicker, HDropdown } from "@/components/form";
import { AdminLayout } from "../layouts/admin";

type SelectOption = {
  label: string;
  value: string;
};

type DispatchFilterForm = {
  routeLineId: string;
  direction: RouteDirection;
  travelDate: string;
  preferredTime: string;
};

function getTodayDateString() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDispatchStatusLabel(status?: string) {
  switch (status) {
    case "AUTO_ASSIGNED":
      return "Tự ghép";
    case "WARNING":
      return "Cần xem lại";
    case "MANUAL_REQUIRED":
      return "Cần điều phối";
    case "MANUALLY_ASSIGNED":
      return "Admin đã ghép";
    default:
      return "Tự ghép";
  }
}

function getDispatchStatusColor(status?: string) {
  switch (status) {
    case "AUTO_ASSIGNED":
      return "success";
    case "WARNING":
      return "warning";
    case "MANUAL_REQUIRED":
      return "error";
    case "MANUALLY_ASSIGNED":
      return "info";
    default:
      return "default";
  }
}

export default function DispatchPage() {
  const methods = useForm<DispatchFilterForm>({
    defaultValues: {
      routeLineId: "",
      direction: "OUTBOUND",
      travelDate: getTodayDateString(),
      preferredTime: "",
    },
  });

  const [routeLineOptions, setRouteLineOptions] = useState<SelectOption[]>([]);
  const [timeOptions, setTimeOptions] = useState<SelectOption[]>([]);
  const [trips, setTrips] = useState<DispatchBoardTripItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [draggingBooking, setDraggingBooking] =
    useState<DispatchBoardBookingItem | null>(null);

  const watchedRouteLineId = methods.watch("routeLineId");
  const watchedDirection = methods.watch("direction");
  const watchedTravelDate = methods.watch("travelDate");

  const loadRouteLines = useCallback(async () => {
    try {
      const data = await getRouteLinesApi({
        page: 1,
        limit: 100,
        status: "ACTIVE",
        sortBy: "name",
        sortOrder: "asc",
      });

      setRouteLineOptions(
        data.items.map((item) => ({
          label: item.name,
          value: item.id,
        }))
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadRouteLines();
  }, [loadRouteLines]);

  const loadAvailableTimes = useCallback(async () => {
    if (!watchedRouteLineId || !watchedDirection || !watchedTravelDate) {
      setTimeOptions([]);
      return;
    }

    try {
      const data = await getAvailableBookingTimesApi({
        routeLineId: watchedRouteLineId,
        direction: watchedDirection,
        travelDate: watchedTravelDate,
        passengerCount: 1,
      });

      setTimeOptions(
        data.items.map((item) => ({
          label: item.label,
          value: item.time,
        }))
      );
    } catch {
      setTimeOptions([]);
    }
  }, [watchedDirection, watchedRouteLineId, watchedTravelDate]);

  useEffect(() => {
    methods.setValue("preferredTime", "");
    setTrips([]);
    loadAvailableTimes();
  }, [loadAvailableTimes, methods]);

  const loadBoard = useCallback(async (values: DispatchFilterForm) => {
    if (!values.routeLineId || !values.travelDate || !values.preferredTime) {
      setErrorMessage("Vui lòng chọn tuyến, ngày đi và giờ đi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getDispatchBoardApi(values);
      setTrips(data.trips);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch: SubmitHandler<DispatchFilterForm> = (values) => {
    loadBoard(values);
  };

  async function handleDropToTrip(targetTrip: DispatchBoardTripItem) {
    if (!draggingBooking) return;

    const sourceTrip = trips.find((trip) =>
      trip.bookings.some((booking) => booking.id === draggingBooking.id)
    );

    if (sourceTrip?.tripId === targetTrip.tripId) {
      setDraggingBooking(null);
      return;
    }

    const confirmed = window.confirm(
      `Chuyển booking ${draggingBooking.bookingCode} sang xe ${
        targetTrip.vehicle?.licensePlate || targetTrip.tripCode
      }?`
    );

    if (!confirmed) {
      setDraggingBooking(null);
      return;
    }

    setMoving(true);
    setErrorMessage("");

    try {
      await moveBookingTripApi(draggingBooking.id, {
        targetTripId: targetTrip.tripId,
        note: "Admin điều phối bằng màn hình kéo thả",
      });

      setDraggingBooking(null);
      await loadBoard(methods.getValues());
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setMoving(false);
    }
  }

  const totalSummary = useMemo(() => {
    return trips.reduce(
      (result, trip) => {
        result.totalSeats += Number(trip.totalSeats || 0);
        result.bookedSeats += Number(trip.bookedSeats || 0);
        result.availableSeats += Number(trip.availableSeats || 0);
        return result;
      },
      {
        totalSeats: 0,
        bookedSeats: 0,
        availableSeats: 0,
      }
    );
  }, [trips]);

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Điều phối chuyến
          </Typography>

          <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
            Xem khách theo từng xe và kéo booking qua lại giữa các xe cùng giờ.
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            mb: 2,
          }}
        >
          <CardContent>
            <FormProvider {...methods}>
              <Box
                component="form"
                onSubmit={methods.handleSubmit(handleSearch)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <HAutocomplete<DispatchFilterForm>
                    name="routeLineId"
                    label="Tuyến khai thác"
                    placeholder="Chọn tuyến"
                    options={routeLineOptions}
                    rules={{
                      required: "Vui lòng chọn tuyến",
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
                  <HDropdown<DispatchFilterForm>
                    name="direction"
                    label="Chiều"
                    options={[
                      { label: "Chiều đi", value: "OUTBOUND" },
                      { label: "Chiều về", value: "RETURN" },
                    ]}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: "span 12", md: "span 2" } }}>
                  <HDatePicker<DispatchFilterForm>
                    name="travelDate"
                    label="Ngày đi"
                    rules={{
                      required: "Vui lòng chọn ngày",
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
                  <HDropdown<DispatchFilterForm>
                    name="preferredTime"
                    label="Giờ đi"
                    placeholder="Chọn giờ"
                    options={timeOptions}
                    rules={{
                      required: "Vui lòng chọn giờ",
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    gridColumn: { xs: "span 12", md: "span 2" },
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || moving}
                    sx={{
                      height: 44,
                      borderRadius: 2,
                      width: "100%",
                    }}
                  >
                    {loading ? "Đang tải..." : "Tải board"}
                  </Button>
                </Box>
              </Box>
            </FormProvider>

            {errorMessage && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "#fff7ed",
                  color: "#c2410c",
                  fontSize: 14,
                }}
              >
                {errorMessage}
              </Box>
            )}
          </CardContent>
        </Card>

        {trips.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mb: 2,
              flexWrap: "wrap",
              rowGap: 1,
            }}
          >
            <Chip label={`Số xe: ${trips.length}`} />
            <Chip label={`Tổng ghế: ${totalSummary.totalSeats}`} />
            <Chip label={`Đã đặt: ${totalSummary.bookedSeats}`} />
            <Chip label={`Còn trống: ${totalSummary.availableSeats}`} />
          </Stack>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 2,
            minHeight: 420,
          }}
        >
          {trips.map((trip) => (
            <Card
              key={trip.tripId}
              elevation={0}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropToTrip(trip)}
              sx={{
                minWidth: 330,
                maxWidth: 370,
                border: "1px solid",
                borderColor: draggingBooking ? "primary.main" : "divider",
                borderRadius: 3,
                bgcolor: "#fff",
                alignSelf: "flex-start",
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 900 }}>
                    {trip.vehicle?.licensePlate || trip.tripCode}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Tài xế: {trip.driver?.fullName || "-"}
                  </Typography>

                  <Chip
                    size="small"
                    label={`${trip.bookedSeats}/${trip.totalSeats} khách · còn ${trip.availableSeats}`}
                    color={trip.availableSeats > 0 ? "success" : "error"}
                    variant="outlined"
                  />

                  {trip.pickupStats?.maxDistanceKm !== null &&
                    trip.pickupStats?.maxDistanceKm !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        Cụm đón rộng khoảng{" "}
                        {trip.pickupStats.maxDistanceKm.toFixed(1)}km
                      </Typography>
                    )}
                </Stack>
              </CardContent>

              <Box sx={{ px: 2, pb: 2 }}>
                <Stack spacing={1}>
                  {trip.bookings.length === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        color: "text.secondary",
                        textAlign: "center",
                        border: "1px dashed",
                        borderColor: "divider",
                      }}
                    >
                      Chưa có khách
                    </Box>
                  ) : (
                    trip.bookings.map((booking) => (
                      <Box
                        key={booking.id}
                        draggable
                        onDragStart={() => setDraggingBooking(booking)}
                        onDragEnd={() => setDraggingBooking(null)}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          cursor: moving ? "not-allowed" : "grab",
                          bgcolor: "#fff",
                          opacity:
                            draggingBooking?.id === booking.id ? 0.55 : 1,
                          "&:hover": {
                            bgcolor: "#f8fafc",
                          },
                        }}
                      >
                        <Stack spacing={0.75}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Typography sx={{ fontWeight: 800 }}>
                              {booking.customerName}
                            </Typography>

                            <Chip
                              size="small"
                              color={
                                getDispatchStatusColor(
                                  booking.dispatchStatus
                                ) as any
                              }
                              label={getDispatchStatusLabel(
                                booking.dispatchStatus
                              )}
                              variant="outlined"
                            />
                          </Box>

                          <Typography variant="body2">
                            {booking.customerPhone} · {booking.passengerCount}{" "}
                            khách
                          </Typography>

                          <Tooltip title={booking.pickupAddress || ""}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              Đón: {booking.pickupAddress || "-"}
                            </Typography>
                          </Tooltip>

                          {booking.dropoffAddress && (
                            <Tooltip title={booking.dropoffAddress}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                Trả: {booking.dropoffAddress}
                              </Typography>
                            </Tooltip>
                          )}

                          {booking.dispatchNote && (
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  booking.dispatchStatus === "MANUAL_REQUIRED"
                                    ? "error.main"
                                    : "warning.main",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {booking.dispatchNote}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            </Card>
          ))}

          {!loading && trips.length === 0 && (
            <Box
              sx={{
                width: "100%",
                p: 4,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Chọn tuyến, ngày, giờ rồi bấm “Tải board” để xem điều phối.
            </Box>
          )}
        </Box>
      </Box>
    </AdminLayout>
  );
}
