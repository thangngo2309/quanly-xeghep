"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { getMyDriverTripsApi, type DriverTripItem } from "@/api/driver.api";
import {
  clearDriverToken,
  getApiErrorMessage,
  getDriverToken,
} from "@/api/http";

function getTodayDateString() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDirectionLabel(direction: string) {
  if (direction === "OUTBOUND") return "Chiều đi";
  if (direction === "RETURN") return "Chiều về";

  return direction;
}

function getStatusColor(status: string) {
  switch (status) {
    case "OPEN":
    case "SCHEDULED":
    case "CONFIRMED":
      return "success";
    case "PENDING":
      return "warning";
    case "CANCELED":
      return "error";
    case "COMPLETED":
    case "FINISHED":
      return "info";
    default:
      return "default";
  }
}

function buildGoogleMapSearchUrl(address?: string | null) {
  if (!address) return "#";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
}

export default function DriverTripsPage() {
  const [date, setDate] = useState(getTodayDateString());
  const [trips, setTrips] = useState<DriverTripItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = getDriverToken();

    if (!token) {
    //   window.location.href = "/login";
    }
  }, []);

  const loadTrips = useCallback(async () => {
    const token = getDriverToken();
  
    if (!token) {
      window.location.href = '/xeghep/driver/login';
      return;
    }
  
    setLoading(true);
    setErrorMessage('');
  
    try {
      const data = await getMyDriverTripsApi({
        date,
      });
  
      setTrips(data.items);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        clearDriverToken();
        window.location.href = '/xeghep/driver/login';
        return;
      }
  
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  function handleLogout() {
    clearDriverToken();
    window.location.href = "/xeghep/driver/login";
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f3f7f6",
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Chuyến xe của tôi
            </Typography>

            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
              Danh sách chuyến cần chạy và khách cần đón.
            </Typography>
          </Box>

          <Button variant="outlined" color="error" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            mb: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 1.5,
                alignItems: { xs: "stretch", md: "center" },
              }}
            >
              <Box
                component="input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                sx={{
                  height: 44,
                  borderRadius: 2,
                  border: "1px solid #d0d5dd",
                  px: 1.5,
                  fontSize: 15,
                  bgcolor: "#fff",
                }}
              />

              <Button
                variant="contained"
                onClick={loadTrips}
                disabled={loading}
                sx={{
                  height: 44,
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 800,
                }}
              >
                {loading ? "Đang tải..." : "Tải chuyến"}
              </Button>
            </Box>

            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Stack spacing={2}>
          {trips.length === 0 && !loading && (
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography color="text.secondary">
                  Không có chuyến nào trong ngày đã chọn.
                </Typography>
              </CardContent>
            </Card>
          )}

          {trips.map((trip) => (
            <Card
              key={trip.tripId}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1.5,
                      alignItems: "flex-start",
                      flexDirection: { xs: "column", md: "row" },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                        {trip.routeLine?.name || trip.tripCode}
                      </Typography>

                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {getDirectionLabel(trip.direction)} · Giờ chạy:{" "}
                        <strong>{formatTime(trip.departureTime)}</strong>
                      </Typography>

                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Ngày giờ: {formatDateTime(trip.departureTime)}
                      </Typography>

                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Xe: {trip.vehicle?.licensePlate || "-"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={`${trip.bookedSeats}/${trip.totalSeats} khách`}
                        color="success"
                        variant="outlined"
                      />

                      <Chip
                        label={trip.status}
                        color={getStatusColor(trip.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Divider />

                  <Typography sx={{ fontWeight: 800 }}>
                    Danh sách khách
                  </Typography>

                  {trip.bookings.length === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        color: "text.secondary",
                      }}
                    >
                      Chuyến này chưa có khách.
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {trip.bookings.map((booking, index) => (
                        <Box
                          key={booking.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "#fff",
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
                                {index + 1}. {booking.customerName}
                              </Typography>

                              <Chip
                                size="small"
                                label={`${booking.passengerCount} khách`}
                              />
                            </Box>

                            <Typography>
                              SĐT:{" "}
                              <Box
                                component="a"
                                href={`tel:${booking.customerPhone}`}
                                sx={{
                                  fontWeight: 800,
                                  color: "primary.main",
                                }}
                              >
                                {booking.customerPhone}
                              </Box>
                            </Typography>

                            <Typography color="text.secondary">
                              Đón: {booking.pickupAddress || "-"}
                            </Typography>

                            {booking.pickupAddress && (
                              <Button
                                component="a"
                                href={buildGoogleMapSearchUrl(
                                  booking.pickupAddress
                                )}
                                target="_blank"
                                rel="noreferrer"
                                variant="outlined"
                                size="small"
                                sx={{
                                  alignSelf: "flex-start",
                                  borderRadius: 999,
                                }}
                              >
                                Mở bản đồ điểm đón
                              </Button>
                            )}

                            {booking.pickupNote && (
                              <Typography color="text.secondary">
                                Ghi chú đón: {booking.pickupNote}
                              </Typography>
                            )}

                            {booking.dropoffAddress && (
                              <Typography color="text.secondary">
                                Trả: {booking.dropoffAddress}
                              </Typography>
                            )}

                            {booking.dropoffNote && (
                              <Typography color="text.secondary">
                                Ghi chú trả: {booking.dropoffNote}
                              </Typography>
                            )}

                            {booking.note && (
                              <Typography color="text.secondary">
                                Ghi chú: {booking.note}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
