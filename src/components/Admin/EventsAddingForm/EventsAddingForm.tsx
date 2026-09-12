import React, { useMemo, useState } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import EmployeeCard from "./EmployeeCard";
import PublishSlotsDialog, { type GeneratedSlot } from "./PublishSlotsDialog";
import { useFirebase } from "@/firebase";
import { formatDate } from "@/utils/format";
import {
    WEEKDAYS,
    effectiveDays,
    generateSlots,
    groupSlotsByWeek,
    nextQuarterHour,
    validateSlotWindow,
    weekdayName,
} from "./useSlotgenerator";

const DURATION_PRESETS = [15, 30, 60, 90, 120, 150];
const DEFAULT_DURATION_MIN = 60;
const MINUTE_MS = 60 * 1000;
const MAX_EXTRA_WEEKS = 52;
const NO_DAYS: Record<string, boolean> = Object.fromEntries(WEEKDAYS.map((day) => [day, false]));
const SECTION_HEADING = {
    fontWeight: 700,
    mb: 2,
    color: "text.secondary",
    textTransform: "uppercase",
} as const;

/** The one method this form needs from the Firebase class. */
interface SlotWriter {
    writeEventData: (events: GeneratedSlot[]) => Promise<void>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** 0 is this week only; N is this week plus the next N weeks. */
const weeksOptionLabel = (n: number) => (n === 0 ? "Just this week" : `This week + next ${plural(n, "week")}`);

export default function EventsAddingForm() {
    // useFirebase() is typed from a JS context created with `null`. Narrow it to
    // the single method used here rather than casting to any.
    const firebase = useFirebase() as SlotWriter | null;
    const employees = useSelector((state: any) => state.employees.list);

    const [initialStart] = useState(() => nextQuarterHour(new Date()));
    const [selectedDate, setSelectedDate] = useState<Date>(initialStart);
    const [selectedEndDate, setSelectedEndDate] = useState<Date>(
        () => new Date(initialStart.getTime() + DEFAULT_DURATION_MIN * MINUTE_MS)
    );
    const [activeEmployee, setActiveEmployee] = useState<any>({});
    const [noOfWeeks, setNoOfWeeks] = useState(0);
    const [title, setTitle] = useState("Appointment Available");
    // Days ticked by hand only. The start date's weekday is never stored here —
    // effectiveDays() derives it, so it follows the picker and a real tick on
    // that day survives the start moving away.
    const [particularDays, setParticularDays] = useState<Record<string, boolean>>(NO_DAYS);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [notice, setNotice] = useState<{ severity: "success" | "warning"; text: string } | null>(null);

    const startDay = weekdayName(selectedDate);
    const ticked = useMemo(() => WEEKDAYS.filter((day) => particularDays[day]), [particularDays]);
    const days = useMemo(() => effectiveDays(ticked, selectedDate), [ticked, selectedDate]);
    const windowError = validateSlotWindow(selectedDate, selectedEndDate);

    const allDaysSelected = days.length === WEEKDAYS.length;
    const someDaysSelected = days.length > 1 && !allDaysSelected;

    // Exactly what Publish would create. The review dialog shows and writes
    // this same array, so what's reviewed is what's written.
    const preview: GeneratedSlot[] = useMemo(() => {
        if (windowError) return [];
        return generateSlots({
            selectedDate,
            selectedEndDate,
            title,
            employee: { id: activeEmployee.id },
            days: ticked,
            noOfWeeks,
        });
    }, [windowError, selectedDate, selectedEndDate, title, activeEmployee.id, ticked, noOfWeeks]);

    const summary = useMemo(() => {
        if (preview.length === 0) return null;
        const groups = groupSlotsByWeek(preview, selectedDate);
        const thisWeek = groups[0]?.week === 0 ? groups[0].slots.length : 0;
        const later = preview.length - thisWeek;
        const shape =
            noOfWeeks === 0
                ? "this week only"
                : `${thisWeek} this week + ${later} over the next ${plural(noOfWeeks, "week")}`;
        const span = `${formatDate(new Date(preview[0].start))} → ${formatDate(new Date(preview[preview.length - 1].start))}`;
        return `${plural(preview.length, "slot")} · ${shape} · ${span}`;
    }, [preview, selectedDate, noOfWeeks]);

    const handleStartChange = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);
        // Half-typed values arrive as Invalid Date; don't drag the end with them.
        if (Number.isNaN(date.getTime())) return;
        // Keep the slot's length when the start moves, so the end can't be left
        // on the old day or end up before the new start.
        const duration = selectedEndDate.getTime() - selectedDate.getTime();
        setSelectedEndDate(new Date(date.getTime() + duration));
    };

    const handleEndChange = (time: Date | null) => {
        if (!time || Number.isNaN(time.getTime())) return;
        // A time on the start's own day — the end can't drift to another date.
        const end = new Date(selectedDate.getTime());
        end.setHours(time.getHours(), time.getMinutes(), 0, 0);
        setSelectedEndDate(end);
    };

    const handlePresetDuration = (minutes: number) => {
        setSelectedEndDate(new Date(selectedDate.getTime() + minutes * MINUTE_MS));
    };

    const handleWeekDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParticularDays({ ...particularDays, [event.target.name]: event.target.checked });
    };

    const handleEveryDayToggle = () => {
        const next = !allDaysSelected;
        setParticularDays(Object.fromEntries(WEEKDAYS.map((day) => [day, next])));
    };

    const handleReview = () => {
        setNotice(null);
        if (!activeEmployee.id) {
            setNotice({ severity: "warning", text: "Select a professional first." });
            return;
        }
        if (windowError) return;
        setReviewOpen(true);
    };

    // Throwing keeps the review dialog open with the message, so a failed write
    // is never reported as published.
    const handleConfirmPublish = async (selected: GeneratedSlot[]) => {
        if (!firebase) {
            throw new Error("Firebase isn't connected — FirebaseContext.Provider isn't mounted.");
        }
        await firebase.writeEventData(selected);
        setReviewOpen(false);
        // Keep the professional, time and title for the next batch; clear the pattern.
        setParticularDays(NO_DAYS);
        setNoOfWeeks(0);
        setNotice({ severity: "success", text: `Published ${plural(selected.length, "slot")}.` });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mx: "auto",
                    my: 4,
                    maxWidth: 900,
                    borderRadius: 4,
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                }}
            >
                <Typography variant="h4" component="h2" align="center" sx={{ fontWeight: 800, mb: 4, color: "#2c3e50" }}>
                    Generate Appointment Slots
                </Typography>

                {/* 1. Select Assigned Professional Section */}
                <Typography variant="subtitle1" sx={SECTION_HEADING}>
                    1. Select Staff Professional
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {employees.map((emp: any) => (
                        // Keyed by id: two professionals can share a colour.
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={emp.id}>
                            <EmployeeCard
                                handleActiveEmployee={setActiveEmployee}
                                activeEmployee={activeEmployee}
                                employee={emp}
                            />
                        </Grid>
                    ))}
                </Grid>

                {activeEmployee.id && (
                    <Alert
                        severity="success"
                        action={
                            <Button color="inherit" size="small" onClick={() => setActiveEmployee({})}>
                                CLEAR
                            </Button>
                        }
                        sx={{ mb: 3, borderRadius: 2 }}
                    >
                        Currently Selected: <strong>{activeEmployee.name}</strong>
                    </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* 2. Slot Configuration Section */}
                <Typography variant="subtitle1" sx={SECTION_HEADING}>
                    2. Slot Setup
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        label="Service Title / Category Name"
                        variant="outlined"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DateTimePicker
                                value={selectedDate}
                                disablePast
                                // The salon is closed on Sundays, so they aren't offered.
                                shouldDisableDate={(day) => day.getDay() === 0}
                                onChange={handleStartChange}
                                slotProps={{ textField: { fullWidth: true } }}
                                label="Start"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TimePicker
                                value={selectedEndDate}
                                onChange={handleEndChange}
                                slotProps={{ textField: { fullWidth: true, helperText: "Same day as the start" } }}
                                label="End"
                            />
                        </Grid>
                    </Grid>

                    {windowError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {windowError}
                        </Alert>
                    )}

                    {/* Quick Preset Durations */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                            Quick Presets (Adds to Start Time):
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                            {DURATION_PRESETS.map((mins) => (
                                <Button
                                    key={mins}
                                    onClick={() => handlePresetDuration(mins)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderRadius: 3, textTransform: "none" }}
                                >
                                    {mins} min
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* 3. Recurrence — which days and for how long are independent */}
                <Typography variant="subtitle1" sx={SECTION_HEADING}>
                    3. Which Days, and For How Long
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={allDaysSelected}
                                    indeterminate={someDaysSelected}
                                    onChange={handleEveryDayToggle}
                                />
                            }
                            label="Every day (Mon – Sat)"
                        />
                        <FormGroup row>
                            {WEEKDAYS.map((day) => {
                                const isStartDay = day === startDay;
                                return (
                                    <FormControlLabel
                                        key={day}
                                        control={
                                            <Checkbox
                                                name={day}
                                                checked={isStartDay || particularDays[day]}
                                                onChange={handleWeekDayChange}
                                                // Locked on: the start date always gets a slot.
                                                disabled={isStartDay}
                                            />
                                        }
                                        label={isStartDay ? `${day} · start` : day}
                                    />
                                );
                            })}
                        </FormGroup>
                        <FormHelperText>The start date's day is always included.</FormHelperText>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <FormControl fullWidth>
                            <InputLabel id="weeks-select-label">For how long</InputLabel>
                            <Select
                                labelId="weeks-select-label"
                                value={noOfWeeks}
                                label="For how long"
                                onChange={(e) => setNoOfWeeks(Number(e.target.value))}
                            >
                                {Array.from({ length: MAX_EXTRA_WEEKS + 1 }, (_, n) => (
                                    <MenuItem key={n} value={n}>
                                        {weeksOptionLabel(n)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* 4. What will be created */}
                {summary && (
                    <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                        {summary}
                    </Alert>
                )}
                {notice && (
                    <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mt: 2, borderRadius: 2 }}>
                        {notice.text}
                    </Alert>
                )}

                <Button
                    onClick={handleReview}
                    disabled={Boolean(windowError)}
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                        mt: 3,
                        py: 1.8,
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        textTransform: "uppercase",
                        borderRadius: 3,
                        boxShadow: "0 4px 14px rgba(25, 118, 210, 0.4)",
                    }}
                >
                    Review &amp; Publish
                </Button>
            </Paper>

            <PublishSlotsDialog
                open={reviewOpen}
                slots={preview}
                startDate={selectedDate}
                professionalName={activeEmployee.name}
                onCancel={() => setReviewOpen(false)}
                onConfirm={handleConfirmPublish}
            />
        </LocalizationProvider>
    );
}
