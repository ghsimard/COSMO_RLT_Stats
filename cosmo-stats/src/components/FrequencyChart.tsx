import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box
} from '@mui/material';
import { getFrequencyRatings } from '../services/databaseService';
import { FrequencyData } from '../types';
import Spinner from './Spinner';
import './FrequencyChart.css';

export const FrequencyChart: React.FC = () => {
  const [data, setData] = useState<FrequencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const frequencyData = await getFrequencyRatings();
        console.log('Received data:', frequencyData);
        setData(frequencyData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading frequency data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
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
  type Rating = typeof ratings[number];
  
  const ratingLabels: Record<Rating, string> = {
    S: 'S',
    A: 'A',
    N: 'N'
  };

  const headerGroups = ['Docentes', 'Estudiantes', 'Acudientes'];

  const renderFrequencyValue = (value: number | null | undefined | string) => {
    if (value === null || value === undefined || value === "NA") {
      return '';
    }
    return `${value}%`;
  };

  const getCellStyle = (value: number | null | undefined | string, rating: string, isLastInGroup: boolean) => {
    const numValue = typeof value === 'number' ? value : parseInt(value as string);
    const shouldEmphasize = rating === 'S' && !isNaN(numValue) && numValue < 50;
    const isNA = value === "NA";

    return {
      borderRight: isLastInGroup ? '2px solid #e0e0e0' : 'none',
      padding: '4px 8px',
      color: shouldEmphasize ? '#ffffff' : '#000000',
      ...(shouldEmphasize && {
        backgroundColor: '#000000',
        fontWeight: 'bold'
      }),
      ...(isNA && {
        backgroundImage: 'repeating-linear-gradient(45deg, #ffffff, #ffffff 8px, #f0f0f0 8px, #f0f0f0 16px)',
      })
    };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Distribución de Frecuencias
      </Typography>
      {data?.map((section, sectionIndex) => (
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
                      borderRight: '2px solid #e0e0e0',
                      padding: '8px',
                      textAlign: 'center'
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
                        backgroundColor: '#f5f5f5',
                        padding: '8px'
                      }}
                    >
                      {group}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ borderRight: '2px solid #e0e0e0', padding: '8px' }} />
                  {headerGroups.map((group, groupIndex) => (
                    <React.Fragment key={group}>
                      {ratings.map((rating, ratingIndex) => (
                        <TableCell 
                          key={`${group}-${rating}`} 
                          align="center" 
                          sx={{ 
                            fontWeight: 'bold',
                            borderRight: ratingIndex === 2 && groupIndex < headerGroups.length - 1 ? '2px solid #e0e0e0' : 'none',
                            padding: '8px'
                          }}
                        >
                          {ratingLabels[rating]}
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
                      sx={{ 
                        borderRight: '2px solid #e0e0e0',
                        padding: '8px'
                      }}
                    >
                      {item.displayText}
                    </TableCell>
                    {/* Docentes */}
                    {ratings.map((rating, i) => {
                      const value = item.results?.docentes?.[rating];
                      return (
                        <TableCell 
                          key={`docentes-${rating}`} 
                          align="center"
                          sx={getCellStyle(value, rating, i === 2)}
                        >
                          {renderFrequencyValue(value)}
                        </TableCell>
                      );
                    })}
                    {/* Estudiantes */}
                    {ratings.map((rating, i) => {
                      const value = item.results?.estudiantes?.[rating];
                      return (
                        <TableCell 
                          key={`estudiantes-${rating}`} 
                          align="center"
                          sx={getCellStyle(value, rating, i === 2)}
                        >
                          {renderFrequencyValue(value)}
                        </TableCell>
                      );
                    })}
                    {/* Acudientes */}
                    {ratings.map((rating, i) => {
                      const value = item.results?.acudientes?.[rating];
                      return (
                        <TableCell 
                          key={`acudientes-${rating}`} 
                          align="center"
                          sx={getCellStyle(value, rating, i === 2)}
                        >
                          {renderFrequencyValue(value)}
                        </TableCell>
                      );
                    })}
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