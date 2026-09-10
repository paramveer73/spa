import React, { useState, useMemo } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Checkbox,
    FormGroup,
    FormControlLabel,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Divider,
    Stack,
    Alert
} from "@mui/material";
import EmployeeCard from "./EmployeeCard";
import { useFirebase } from "@/app_state";
import { useSelector } from "react-redux";
// Import our new clean API helper functions
import { generateSlots } from "./useSlotgenerator";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATION_PRESETS = [30, 60, 90, 120, 150];

export default function EventsAddingForm() {
    const firebase = useFirebase();
    const employees = useSelector((state: any) => state.employees.list);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedEndDate, setSelectedEndDate] = useState<Date>(new Date());
    const [activeEmployee, setActiveEmployee] = useState<any>({});
    const [isEveryDayInWeek, setIsEveryDayInWeek] = useState(false);
    const [noOfWeeks, setNoOfWeeks] = useState(0);
    const [title, setTitle] = useState("Appointment Available");

    const [particularDays, setParticularDays] = useState({
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
    });

    const hasSelectedParticularDays = useMemo(() => {
        return Object.values(particularDays).some((isSelected) => isSelected);
    }, [particularDays]);

    const handleWeekDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParticularDays({
            ...particularDays,
            [event.target.name]: event.target.checked,
        });
    };

    const handlePresetDuration = (minutes: number) => {
        const calculatedEndDate = new Date(selectedDate.getTime() + minutes * 60 * 1000);
        setSelectedEndDate(calculatedEndDate);
    };

    const handlePublishSlots = () => {
        if (selectedDate.getDay() === 0) {
            window.alert("The salon is closed on Sundays. Please select another day.");
            return;
        }
        if (!activeEmployee.color) {
            window.alert("Please select an assigned professional.");
            return;
        }

        // Call our pure function to construct the array of slots
        const generatedEvents = generateSlots({
            selectedDate,
            selectedEndDate,
            title,
            employee: activeEmployee,
            particularDays,
            isEveryDayInWeek,
            noOfWeeks,
        });

        // Write to Firebase
        firebase.writeEventData(generatedEvents);
        window.alert(`Successfully published ${generatedEvents.length} availability slots!`);
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "text.secondary", textTransform: "uppercase" }}>
                    1. Select Staff Professional
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {employees.map((emp: any) => (
                        <Grid item xs={12} sm={6} md={4} key={emp.color}>
                            <EmployeeCard
                                handleActiveEmployee={setActiveEmployee}
                                activeEmployee={activeEmployee}
                                employee={emp}
                            />
                        </Grid>
                    ))}
                </Grid>

                {activeEmployee.name && (
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "text.secondary", textTransform: "uppercase" }}>
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
                                onChange={(date) => date && setSelectedDate(date)}
                                slotProps={{ textField: { fullWidth: true } }}
                                label="Start Time"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DateTimePicker
                                value={selectedEndDate}
                                disablePast
                                onChange={(date) => date && setSelectedEndDate(date)}
                                slotProps={{ textField: { fullWidth: true } }}
                                label="End Time"
                            />
                        </Grid>
                    </Grid>

                    {/* Quick Preset Durations */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                            Quick Presets (Adds to Start Time):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
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

                {/* 3. Recurrence & Bulk Rules Section */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "text.secondary", textTransform: "uppercase" }}>
                    3. Recurrence & Scaling Rules
                </Typography>

                {!hasSelectedParticularDays ? (
                    <Stack spacing={2} sx={{ mb: 3 }}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isEveryDayInWeek}
                                        onChange={(e) => setIsEveryDayInWeek(e.target.checked)}
                                    />
                                }
                                label="Populate Every Day in the Week (Mon - Sat)"
                            />
                        </FormGroup>

                        <FormControl fullWidth>
                            <InputLabel id="weeks-select-label">Repeat for how many weeks?</InputLabel>
                            <Select
                                labelId="weeks-select-label"
                                value={noOfWeeks}
                                label="Repeat for how many weeks?"
                                onChange={(e: any) => setNoOfWeeks(Number(e.target.value))}
                            >
                                {Array.from({ length: 53 }).map((_, idx) => (
                                    <MenuItem key={idx} value={idx}>
                                        {idx === 0 ? "Just this week (0)" : `${idx} weeks`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                ) : (
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        Specific Days selection overrides general weekly repeat settings.
                    </Alert>
                )}

                <Box sx={{ mb: 4 }}>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: "text.secondary" }}>
                        Select individual custom days to populate:
                    </Typography>
                    <FormGroup row sx={{ justifyContent: "space-between" }}>
                        {DAYS.map((day) => (
                            <FormControlLabel
                                key={day}
                                control={
                                    <Checkbox
                                        checked={particularDays[day as keyof typeof particularDays]}
                                        onChange={handleWeekDayChange}
                                        name={day}
                                        disabled={isEveryDayInWeek}
                                    />
                                }
                                label={day}
                            />
                        ))}
                    </FormGroup>
                </Box>

                <Button
                    onClick={handlePublishSlots}
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                        py: 1.8,
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        textTransform: "uppercase",
                        borderRadius: 3,
                        boxShadow: "0 4px 14px rgba(25, 118, 210, 0.4)",
                    }}
                >
                    Publish Available Slots
                </Button>
            </Paper>
        </LocalizationProvider>
    );
}