import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

interface FrequencyData {
  title: string;
  questions: {
    displayText: string;
    results: {
      docentes?: { S: number; A: number; N: number };
      estudiantes?: { S: number; A: number; N: number };
      acudientes?: { S: number; A: number; N: number };
    };
  }[];
}

export const FrequencyChart: React.FC = () => {
  const [data, setData] = useState<FrequencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:4001/api/frequency-ratings');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching frequency data:', err);
        setError('Error loading frequency data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const ratings = ['S', 'A', 'N'] as const;
  const headerGroups = ['Docentes', 'Estudiantes', 'Acudientes'];

  const renderFrequencyValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (value < 0) {
      return 'N/A';
    }
    return `${value}%`;
  };

  const getCellStyle = (value: number | null | undefined, rating: string, isLastInGroup: boolean) => {
    const shouldEmphasize = rating === 'S' && typeof value === 'number' && value < 50;
    return {
      borderRight: isLastInGroup ? '2px solid #e0e0e0' : 'none',
      padding: '8px',
      backgroundColor: shouldEmphasize ? '#000000' : 'inherit',
      color: shouldEmphasize ? '#ffffff' : 'inherit',
      fontWeight: shouldEmphasize ? 'bold' : 'normal'
    };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Distribución de Frecuencias
      </Typography>
      {data.map((section, sectionIndex) => (
        <Box key={sectionIndex} sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
            {section.title}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      width: '40%',
                      borderRight: '2px solid #e0e0e0'
                    }}
                  >
                    Item de la encuesta
                  </TableCell>
                  {headerGroups.map((group, index) => (
                    <TableCell 
                      key={group}
                      align="center" 
                      colSpan={3}
                      sx={{ 
                        fontWeight: 'bold',
                        width: '20%',
                        borderRight: index < headerGroups.length - 1 ? '2px solid #e0e0e0' : 'none',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      {group}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ borderRight: '2px solid #e0e0e0' }} />
                  {headerGroups.map((group, groupIndex) => (
                    <React.Fragment key={group}>
                      {ratings.map((rating, ratingIndex) => (
                        <TableCell 
                          key={`${group}-${rating}`}
                          align="center"
                          sx={{ 
                            fontWeight: 'bold',
                            borderRight: ratingIndex === 2 && groupIndex < headerGroups.length - 1 ? '2px solid #e0e0e0' : 'none'
                          }}
                        >
                          {rating}
                        </TableCell>
                      ))}
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {section.questions?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ borderRight: '2px solid #e0e0e0' }}
                    >
                      {item.displayText}
                    </TableCell>
                    {/* Docentes */}
                    {ratings.map((rating, i) => (
                      <TableCell 
                        key={`docentes-${rating}`}
                        align="center"
                        sx={getCellStyle(item.results?.docentes?.[rating], rating, i === 2)}
                      >
                        {renderFrequencyValue(item.results?.docentes?.[rating])}
                      </TableCell>
                    ))}
                    {/* Estudiantes */}
                    {ratings.map((rating, i) => (
                      <TableCell 
                        key={`estudiantes-${rating}`}
                        align="center"
                        sx={getCellStyle(item.results?.estudiantes?.[rating], rating, i === 2)}
                      >
                        {renderFrequencyValue(item.results?.estudiantes?.[rating])}
                      </TableCell>
                    ))}
                    {/* Acudientes */}
                    {ratings.map((rating, i) => (
                      <TableCell 
                        key={`acudientes-${rating}`}
                        align="center"
                        sx={getCellStyle(item.results?.acudientes?.[rating], rating, i === 2)}
                      >
                        {renderFrequencyValue(item.results?.acudientes?.[rating])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Container>
  );
}; 