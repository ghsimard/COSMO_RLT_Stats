import React from 'react';
import { Container, Typography } from '@mui/material';

export const FrequencyChart: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Frequency Chart
      </Typography>
    </Container>
  );
}; 