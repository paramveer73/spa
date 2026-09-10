import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Stack,
    Divider
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ClearIcon from '@mui/icons-material/Clear';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface DeleteEventsDashboardProps {
    events: any[];
    deleteEventsForSure: () => void;
    clearDeleteEventsArray: () => void;
}

export function DeleteEventsDashboard({
    events,
    deleteEventsForSure,
    clearDeleteEventsArray
}: DeleteEventsDashboardProps) {

    // Guard clause: Return null directly if there are no events to render
    if (!events || events.length === 0) {
        return null;
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 4,
                my: 4,
                borderRadius: 4,
                border: '1px solid #ffebee', // Gentle warning-red tint border
                backgroundColor: '#fafafb',
            }}
        >
            {/* Header */}
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <DeleteSweepIcon color="error" sx={{ fontSize: 32 }} />
                <Typography variant="h5" component="h3" sx={{ fontWeight: 800, color: '#2c3e50' }}>
                    Pending Selection to Delete ({events.length})
                </Typography>
            </Box>

            {/* Grid of Selected Events to Delete */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {events.map((event) => (
                    <Grid item xs={12} sm={6} md={4} key={event.eventKey || event.id}>
                        <DeleteEventCard event={event} />
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Action Bar */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
                <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ClearIcon />}
                    onClick={clearDeleteEventsArray}
                    sx={{
                        py: 1.5,
                        px: 3,
                        fontWeight: 700,
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        borderColor: '#ccc',
                        '&:hover': {
                            borderColor: '#888',
                            backgroundColor: '#f5f5f5',
                        }
                    }}
                >
                    Clear Selection
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={deleteEventsForSure}
                    sx={{
                        py: 1.5,
                        px: 4,
                        fontWeight: 700,
                        borderRadius: 3,
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 14px rgba(211, 47, 47, 0.4)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(211, 47, 47, 0.6)',
                        }
                    }}
                >
                    Delete Selected Events
                </Button>
            </Stack>
        </Paper>
    );
}

function DeleteEventCard({ event }: { event: any }) {
    // Extract and format parts of the date smoothly
    const formatDateTime = (timeString: string) => {
        if (!timeString) return { date: 'N/A', time: 'N/A' };

        const d = new Date(timeString);
        if (isNaN(d.getTime())) return { date: 'Invalid Date', time: '' };

        // Format like: "Wed, Jul 15, 2026"
        const date = d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Format like: "1:15 PM"
        const time = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return { date, time };
    };

    const startInfo = formatDateTime(event.start);
    const endInfo = formatDateTime(event.end);

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#ffcdd2', // Soft red border on hover
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.08)',
                }
            }}
        >
            {/* Event Title Header if available */}
            {event.title && (
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {event.title}
                </Typography>
            )}

            {/* Start Time info block */}
            <Box>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: 'error.main', mb: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14 }} /> START
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {startInfo.date}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12 }} /> {startInfo.time}
                </Typography>
            </Box>

            <Divider />

            {/* End Time info block */}
            <Box>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14 }} /> END
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {endInfo.date}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12 }} /> {endInfo.time}
                </Typography>
            </Box>
        </Paper>
    );
}