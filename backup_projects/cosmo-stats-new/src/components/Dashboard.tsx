import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';

export const Dashboard: React.FC = () => {
  const history = useHistory();

  const handleNavigate = () => {
    history.push('/frequency');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button variant="contained" color="primary" onClick={handleNavigate}>
          View Frequency Chart
        </Button>
      </Box>
    </Container>
  );
}; 