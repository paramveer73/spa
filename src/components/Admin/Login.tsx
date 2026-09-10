import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, TextField, Button, Typography } from '@mui/material';
import { ROUTES } from '@/Routes'; // Import your routes constant
import { useFirebase } from '@/app_state';

export default function Login() {
  const firebase = useFirebase() as any; // Cast as 'any' to stop TS errors
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await firebase?.doSignInWithEmailAndPassword(email, password);
      // Navigate to the constant defined in your routes
      navigate(ROUTES.ADMIN_DASHBOARD);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" align="center">Management Gateway</Typography>
        <TextField
          label="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button variant="contained" onClick={handleLogin}>Authenticate</Button>
      </Card>
    </Container>
  );
}