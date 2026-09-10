
import { useNavigate } from 'react-router-dom';
import { Card, Box, Typography, Button } from '@mui/material';

export default function DashboardView({ title, length, yearmonth }: any) {

  const navigate = useNavigate();

  return (
    <Card sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 3, boxShadow: 2, mb: 2 }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2">Total Booked: <Box component="span" sx={{ color: '#fe676e', fontWeight: 'bold' }}>{length}</Box></Typography>
      </Box>
      <Button variant="contained" color="success" onClick={() => navigate(`/bookedappointments/${yearmonth}`)}>DETAILS</Button>
    </Card>
  );
}