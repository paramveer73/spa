import { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { formatDate, formatTime } from "./format";
import useBookingAvailability, { isSameDay } from "./useBookingAvailability";
import type { BookingDataSource, Employee, Slot } from "./types";

const NO_OPENING_TOOLTIP = "No appointments on this day";

export interface CalendarProps {
  /** Only needs one method: subscribeToFreeAppointments(year, month,
   * monthFetchingOffset, callback) => unsubscribeFn. Doesn't have to be the
   * real Firebase SDK — anything matching that shape works. */
  firebase: BookingDataSource;
  employees: Employee[];
  /** Called with the raw slot object whenever an open time is clicked. No
   * assumption that a multi-step wizard exists — a host with no wizard at
   * all can pass something as simple as `onSlotClicked={submitBooking}`. */
  onSlotClicked: (slot: Slot) => void;
}

/**
 * Date-picker + slot-list booking UI. Pure presentation: all data fetching,
 * day-paging, filtering and selection logic lives in
 * useBookingAvailability(); this component just renders whatever that hook
 * returns.
 *
 * Layout: a Container+Paper "card", containing a stories-style strip
 * (calendar trigger — a fixed page of 7 day chips — next/prev paging
 * arrows) on top, then the employee filter, the selected date heading, and
 * the open time-slot chips (grouped by Morning/Afternoon/Evening) below,
 * all centered.
 *
 * Standalone/portable: this component has no dependency on any specific
 * app's content/data file, routing, or wizard. It just needs `firebase`,
 * `employees`, and `onSlotClicked` — see CalendarProps above. Copy this
 * whole folder (components/calendar) into another project and wire those
 * three props up to that project's own data.
 */
export default function Calendar({
  firebase,
  employees,
  onSlotClicked,
}: CalendarProps) {
  const [datePickerAnchor, setDatePickerAnchor] =
    useState<HTMLElement | null>(null);

  const {
    employee,
    setEmployee,
    selectedDate,
    selectDate,
    visibleDays,
    dayHasOpening,
    getEarliestSlotForDate,
    goToNextDayWindow,
    goToPrevDayWindow,
    canGoPrevDayWindow,
    shouldDisableCalendarDate,
    handleCalendarMonthChange,
    handleUserTimeSlotClick,
    slotGroupsForSelectedDate,
  } = useBookingAvailability({ firebase, employees, onSlotClicked });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Paper
        elevation={1}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
          p: { xs: 2, md: 3 },
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={12}>
            {/* Stories-style strip: calendar trigger — a fixed page of 7 day
              chips (scrolls internally if the viewport is too narrow to
              show all 7) — prev/next paging arrows, all centered. */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "fit-content",
                maxWidth: "100%",
                mx: "auto",
              }}
            >
              <Tooltip title="Pick a date">
                <IconButton
                  onClick={(event) => setDatePickerAnchor(event.currentTarget)}
                  aria-label="Pick a date"
                  sx={{
                    flexShrink: 0,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    backgroundColor: "white.main",
                  }}
                >
                  <CalendarMonthIcon color="primary" />
                </IconButton>
              </Tooltip>

              {canGoPrevDayWindow && (
                <Tooltip title="Previous 7 days">
                  <IconButton
                    onClick={goToPrevDayWindow}
                    aria-label="Previous 7 days"
                    sx={{
                      flexShrink: 0,
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 2,
                      backgroundColor: "white.main",
                    }}
                  >
                    <ChevronLeftIcon color="primary" />
                  </IconButton>
                </Tooltip>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  minWidth: 0,
                  py: 0.5,
                  px: 0.25,
                  "&::-webkit-scrollbar": { height: 4 },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "white.main",
                    borderRadius: 3,
                  },
                }}
              >
                {visibleDays.map((day) => {
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const available = dayHasOpening(day);
                  const earliestSlot = available
                    ? getEarliestSlotForDate(day)
                    : null;
                  const tooltipTitle = available && earliestSlot
                    ? `Earliest appointment: ${formatTime(earliestSlot.start)}`
                    : NO_OPENING_TOOLTIP;
                  return (
                    <Tooltip key={day.toISOString()} title={tooltipTitle}>
                      <Box
                        onClick={() => available && selectDate(day)}
                        sx={{
                          flexShrink: 0,
                          minWidth: 64,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                          py: 1.5,
                          px: 0.5,

                          // --- 1. Shape & Border Settings ---
                          borderRadius: (theme) => theme.shape.borderRadius, // Sharp corners (0)
                          border: "1px solid",
                          borderColor: isSelected ? "primary.main" : "text.secondary", // Uses #111111 or #444444

                          // --- 2. Color States ---
                          backgroundColor: isSelected
                            ? "primary.main"       // Selected: #111111
                            : "background.paper",  // Unselected: #EFEFEF (contrasts nicely on #E8E8E8)

                          cursor: available ? "pointer" : "not-allowed",
                          opacity: available ? 1 : 0.4, // Visual distinction for disabled dates
                          transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",

                          "&:hover": available
                            ? {
                              transform: "translateY(-2px)",
                              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
                            }
                            : {},
                        }}
                      >
                        {/* Weekday Label */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "typography.caption.fontFamily",
                            letterSpacing: "typography.caption.letterSpacing",
                            textTransform: "typography.caption.textTransform",
                            fontWeight: "typography.caption.fontWeight",
                            fontSize: "0.65rem",
                            color: isSelected ? "background.default" : "text.secondary", // #E8E8E8 vs #444444
                          }}
                        >
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </Typography>

                        {/* Day Number */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "typography.body2.fontFamily",
                            fontWeight: 700, // Slightly bolder for calendar numbers
                            color: isSelected ? "background.default" : "text.primary", // #E8E8E8 vs #111111
                          }}
                        >
                          {day.getDate()}
                        </Typography>

                        {/* Availability Status Indicator Dot */}
                        {available && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              // Rather than introducing an unsynced green, we use a contrast element
                              backgroundColor: isSelected
                                ? "background.default" // Selected dot: #E8E8E8
                                : "primary.main",      // Unselected dot: #111111
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>

              <Tooltip title="Next 7 days">
                <IconButton
                  onClick={goToNextDayWindow}
                  aria-label="Next 7 days"
                  sx={{
                    flexShrink: 0,
                    border: "1px solid",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    backgroundColor: "white.main",
                  }}
                >
                  <ChevronRightIcon color="primary" />
                </IconButton>
              </Tooltip>
            </Box>

            <Popover
              open={Boolean(datePickerAnchor)}
              anchorEl={datePickerAnchor}
              onClose={() => setDatePickerAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newValue) => {
                    if (!newValue) return;
                    selectDate(newValue);
                    setDatePickerAnchor(null);
                  }}
                  disablePast
                  shouldDisableDate={shouldDisableCalendarDate}
                  onMonthChange={handleCalendarMonthChange}
                />
              </LocalizationProvider>
            </Popover>
          </Grid>

          <Grid size={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                mb: 3,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label="All staff"
                onClick={() => setEmployee(null)}
                // If employee is null, "All staff" is active!
                color={!employee ? "secondary" : "default"}
                variant={!employee ? "filled" : "outlined"}
              />
              {employees.map((emp) => (
                <Chip
                  key={emp.id}
                  onClick={() => setEmployee(emp)}
                  color={employee?.id === emp.id ? "secondary" : "default"}
                  variant={employee?.id === emp.id ? "filled" : "outlined"}
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: emp.color,
                        }}
                      />
                      {emp.name}
                    </Box>
                  }
                />
              ))}
            </Box>

            {selectedDate ? (
              <>
                <Typography
                  variant="subtitle1"
                  align="center"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  {formatDate(selectedDate)}
                </Typography>

                {slotGroupsForSelectedDate.length === 0 ? (
                  <Typography variant="body2" color="text" align="center">
                    No openings this day
                    {employee ? `for ${employee.name}` : ""}.
                    Try another date.
                  </Typography>
                ) : (
                  slotGroupsForSelectedDate.map((group) => (
                    <Box key={group.key} sx={{ mb: 2.5, pl: { xs: 1, md: 2 } }}>
                      <Typography
                        variant="overline"
                        color="text"
                        sx={{ display: "block", letterSpacing: 1, mb: 1 }}
                      >
                        {group.label}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          flexWrap: "wrap",
                          gap: 1.25,
                        }}
                      >
                        {group.slots.map((slot) => {
                          const matchingEmployee = employees.find(emp => emp.id === slot.employeeId);
                          const empColor = matchingEmployee?.color || "#111111"; // Fallback to your theme's primary dark color
                          return (
                            <Box
                              key={slot.eventKey}
                              onClick={() => handleUserTimeSlotClick(slot)}
                              className="slot-card"
                              sx={{
                                cursor: "pointer",
                                width: 208,
                                flexShrink: 0,

                                // --- 1. Shape & Border ---
                                // Reads directly from theme.shape.borderRadius (which is 0)
                                borderRadius: (theme) => theme.shape.borderRadius,
                                border: "1px solid",
                                // Uses the customized employee indicator color, falling back to your brand's primary color
                                borderColor: empColor || "primary.main",
                                // For light background cards:
                                // --- 2. Default State: Clean Theme-Agnostic Tokens ---
                                backgroundColor: "background.paper",     // Dynamically resolves to any theme's paper background
                                color: "text.primary",                   // Dynamically resolves to any theme's primary text color

                                px: 2.5,
                                py: 2,
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                                transition:
                                  "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",

                                // --- 3. Hover State: Using Dynamic Theme Values ---
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  boxShadow: (theme) => theme.shadows[3] || "0px 6px 12px rgba(0, 0, 0, 0.15)", // Uses system shadows

                                  // Dynamically uses the theme's default hover background color
                                  backgroundColor: (theme) => theme.palette.action.hover,

                                  borderColor: empColor, // Retains your custom employee color border

                                  // Standardizes text color in hover state using the theme's active/primary text
                                  color: "text.primary",
                                },
                                "&:hover .slot-card-icon": {
                                  // Matches icon hover color to primary text color dynamically
                                  color: "text.primary",
                                }
                              }}
                            >
                              {/* Header Info */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                <AddCircleOutlineIcon
                                  className="slot-card-icon"
                                  fontSize="small"
                                  sx={{
                                    color: "background.default", // Starts with #E8E8E8
                                    transition: "color 0.2s ease",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  noWrap
                                  sx={{
                                    // Resolves to your theme's custom button font configuration
                                    fontFamily: "typography.button.fontFamily",
                                    fontWeight: "typography.button.fontWeight",
                                    letterSpacing: "typography.button.letterSpacing",
                                    textTransform: "typography.button.textTransform",
                                    color: "inherit",
                                    minWidth: 0,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {slot.employeeName
                                    ? `${slot.employeeName}'s Slot`
                                    : "Appointment"}
                                </Typography>
                              </Box>

                              {/* Appointment Time Specifications (Synced with Theme Captions) */}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "inherit",
                                  fontSize: "0.68rem",
                                  opacity: 0.8, // Elegant hierarchy without introducing un-synced grays
                                  fontFamily: "typography.caption.fontFamily",
                                  letterSpacing: "typography.caption.letterSpacing",
                                  textTransform: "typography.caption.textTransform",
                                  fontWeight: "typography.caption.fontWeight"
                                }}
                              >
                                Day — {formatDate(selectedDate)}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  color: "inherit",
                                  fontSize: "0.68rem",
                                  opacity: 0.8,
                                  fontFamily: "typography.caption.fontFamily",
                                  letterSpacing: "typography.caption.letterSpacing",
                                  textTransform: "typography.caption.textTransform",
                                  fontWeight: "typography.caption.fontWeight"
                                }}
                              >
                                Start: {formatTime(slot.start)}
                              </Typography>

                              <Typography
                                variant="caption"
                                sx={{
                                  color: "inherit",
                                  fontSize: "0.68rem",
                                  opacity: 0.8,
                                  fontFamily: "typography.caption.fontFamily",
                                  letterSpacing: "typography.caption.letterSpacing",
                                  textTransform: "typography.caption.textTransform",
                                  fontWeight: "typography.caption.fontWeight"
                                }}
                              >
                                End: {formatTime(slot.end)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))
                )}
              </>
            ) : (
              <Typography variant="body2" color="text" align="center">
                Loading availability…
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
