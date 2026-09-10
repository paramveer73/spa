import { Box, Paper, Typography } from '@mui/material';

export default function EmployeeCard({ employee, activeEmployee, handleActiveEmployee }: any) {
  const isActive = activeEmployee?.id === employee?.id;
  const employeeColor = employee?.color || '#9c27b0';

  return (
    <Paper
      elevation={isActive ? 3 : 1}
      onClick={() => handleActiveEmployee(employee)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        cursor: 'pointer',
        backgroundColor: isActive ? '#fcfdfa' : '#ffffff',
        border: isActive ? `2px solid ${employeeColor}` : '1px solid #e5e7eb',
        borderRadius: 3,
        gap: 2,
        width: '100%', // Enforces filling the entire parent grid cell
        boxSizing: 'border-box',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.06)',
          borderColor: isActive ? employeeColor : '#d1d5db',
        },
      }}
    >
      {/* 1. Profile Color Circle */}
      <Box
        sx={{
          height: 44,
          width: 44,
          borderRadius: '50%',
          backgroundColor: employeeColor,
          boxShadow: `0 3px 8px ${employeeColor}33`,
          flexShrink: 0, // Prevents the circle from squishing into an oval
        }}
      />

      {/* 2. Text Area (Safe from overflow) */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: isActive ? 700 : 600,
            color: '#1f2937',
            fontSize: '0.95rem',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis', // Truncates extremely long names beautifully
          }}
        >
          {employee.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 500,
            display: 'block',
            mt: 0.5,
          }}
        >
          {employee.role || 'Professional'}
        </Typography>
      </Box>
    </Paper>
  );
}