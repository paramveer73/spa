import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Button, Stack } from '@mui/material';

export default function DetailView({ id, appointments, handleBookedAppointmentDelete }: any) {
  const navigate = useNavigate();
  if (!appointments) return null;
  return (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" onClick={() => navigate('/bookedappointments')} sx={{ mb: 3 }}>BACK</Button>
      <Typography variant="h4" align="center" gutterBottom>{id}</Typography>
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        {appointments.map((app: any, idx: number) => (
          <Card key={idx} sx={{ p: 3, width: '100%', maxWidth: 500 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Email: {app.userdata?.email}</Typography>
            <Button variant="contained" color="error" fullWidth sx={{ mt: 2 }} onClick={() => handleBookedAppointmentDelete(app.userdata)}>Cancel Appointment</Button>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}