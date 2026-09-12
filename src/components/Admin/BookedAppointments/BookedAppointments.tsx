import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, Box, Grid, Button } from '@mui/material';
import { useFirebase } from '@/firebase';
import DetailView from './DetailView';

export default function BookedAppointments() {
  const { id } = useParams();
  const firebase = useFirebase();
  const navigate = useNavigate();
  const [bookedAppointments, setBookedAppointments] = useState<Record<string, any>>({});

  useEffect(() => {
    const authListener = firebase?.auth.onAuthStateChanged(user => {
      if (!user) navigate('/login');
    });

    // Modern modular real-time database listener
    const bookedRef = firebase?.bookedAppointments();
    firebase?.doOnValue(bookedRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const tempState: Record<string, any> = {};
        Object.keys(val).forEach(monthlykey => {
          const thisMonthAppointments = val[monthlykey];
          const tempArray = Object.keys(thisMonthAppointments).map(keys => {
            const individualObject = { ...thisMonthAppointments[keys] };
            const temp: any = {};
            if (individualObject.userdata) {
              temp.userdata = individualObject.userdata;
              temp.userdata.epoch = new Date(individualObject.userdata.start).getTime();
              delete individualObject.userdata;
            }
            temp.services = Object.values(individualObject);
            return temp;
          });
          tempState[monthlykey] = tempArray;
        });
        setBookedAppointments(tempState);
      }
    });

    return () => {
      firebase?.doOff(bookedRef);
      authListener();
    };
  }, [firebase, navigate]);

  if (id) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <DetailView
          id={id}
          appointments={bookedAppointments[id] || []}
          handleBookedAppointmentDelete={(u: any) => firebase?.deleteBookedAppointment(u)}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Booked Appointment Archives
      </Typography>
      <Grid container spacing={3}>
        {Object.keys(bookedAppointments).length === 0 ? (
          <Typography variant="body1" sx={{ p: 3, color: 'text.secondary' }}>
            No booked appointment folders found in the record stream.
          </Typography>
        ) : (
          Object.keys(bookedAppointments).map(monthKey => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={monthKey}>
              <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{monthKey}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active bookings: <strong style={{ color: '#fe676e' }}>{bookedAppointments[monthKey].length}</strong>
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => navigate(`/bookedappointments/${monthKey}`)}
                >
                  View Details
                </Button>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}