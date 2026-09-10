import React from 'react';
import { Box, Typography, Stack, Paper, Avatar } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import EmployeeCard from './EventsAddingForm/EmployeeCard';

interface Employee {
    id: string;
    name: string;
    color: string;
    role?: string;
}

interface ProfessionalFilterBarProps {
    employeesList: Employee[];
    activeEmployee: Employee | null; // Can be null if "All" is selected
    setActiveEmployee: (employee: Employee | null) => void;
}

export default function ProfessionalFilterBar({
    employeesList,
    activeEmployee,
    setActiveEmployee,
}: ProfessionalFilterBarProps) {

    const isAllSelected = activeEmployee === null;

    const handleActiveEmployeeToggle = (emp: Employee) => {
        // If the user clicks the already selected employee, toggle/clear it back to "All"
        if (activeEmployee?.id === emp.id) {
            setActiveEmployee(null);
        } else {
            setActiveEmployee(emp);
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            {/* Label section */}
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                }}
            >
                Filter By Professional Assignment
            </Typography>

            {/* Row Wrapper with sleek, smooth momentum-scrolling for mobile devices */}
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    overflowX: 'auto',
                    pb: 1.5,
                    pt: 0.5,
                    px: 0.5, // Small padding prevents hover shadows from clipping
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    '&::-webkit-scrollbar': {
                        height: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#e0e0e0',
                        borderRadius: 3,
                        '&:hover': {
                            backgroundColor: '#bdbdbd',
                        }
                    }
                }}
            >
                {/* 1. "ALL STAFF" Virtual Filter Card */}
                <Paper
                    elevation={isAllSelected ? 4 : 1}
                    onClick={() => setActiveEmployee(null)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        cursor: 'pointer',
                        backgroundColor: isAllSelected ? '#f5f9fc' : '#ffffff',
                        border: isAllSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        borderRadius: 3,
                        gap: 2,
                        minWidth: 220,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
                            borderColor: isAllSelected ? '#1976d2' : '#b0b0b0',
                        },
                    }}
                >
                    {/* Universal Slate-Colored Group Icon */}
                    <Avatar
                        sx={{
                            height: 48,
                            width: 48,
                            bgcolor: isAllSelected ? '#1976d2' : '#78909c',
                            color: '#ffffff',
                            boxShadow: isAllSelected ? '0 3px 8px rgba(25, 118, 210, 0.3)' : 'none',
                            flexShrink: 0,
                        }}
                    >
                        <GroupIcon />
                    </Avatar>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle1"
                            noWrap
                            sx={{
                                fontWeight: isAllSelected ? 700 : 600,
                                color: '#2c3e50',
                                fontSize: '0.95rem',
                            }}
                        >
                            All Staff
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontWeight: 500,
                                display: 'block',
                            }}
                        >
                            Show Everyone
                        </Typography>
                    </Box>
                </Paper>

                {/* 2. Individual Employee Cards */}
                {employeesList.map((emp: any) => (
                    <EmployeeCard
                        key={emp.id}
                        employee={emp}
                        activeEmployee={activeEmployee}
                        handleActiveEmployee={handleActiveEmployeeToggle}
                    />
                ))}
            </Stack>
        </Box>
    );
}