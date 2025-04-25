import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="bg-white shadow">
        <Container maxWidth="lg">
          <Box py={4} display="flex" alignItems="center" gap={2}>
            <img 
              src="/images/LogoCosmo.png"
              alt="COSMO Schools Logo" 
              style={{ 
                height: '50px',
                width: 'auto'
              }} 
            />
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 0 }}>
              COSMO Dashboard
            </Typography>
          </Box>
        </Container>
      </header>

      <Container maxWidth="lg">
        <Box py={4}>
          <Paper elevation={3}>
            <Box p={4}>
              <Typography variant="h5" gutterBottom>
                Bienvenido al Dashboard de COSMO
              </Typography>
              <Typography paragraph>
                Seleccione una de las siguientes opciones para visualizar los datos:
              </Typography>
              
              <Box mt={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<BarChartIcon />}
                  onClick={() => navigate('/frequency')}
                >
                  Distribución de Frecuencias
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </div>
  );
}; 