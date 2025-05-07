import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale
);

interface GradesPieChartProps {
  school: string;
}

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface ApiResponse {
  school: string;
  data: PieChartData[];
  debug: {
    rawData: any[];
  };
}

export const GradesPieChart: React.FC<GradesPieChartProps> = ({ school }) => {
  const [data, setData] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/api/test-grades?school=${encodeURIComponent(school)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result: ApiResponse = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching pie chart data:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    if (school) {
      fetchData();
    }
  }, [school]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: Array(data.length).fill('#ffffff'),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        ¿En qué grados tiene clases?
      </Typography>
      <Box sx={{ 
        maxWidth: 400, 
        margin: '0 auto', 
        height: 400,
        position: 'relative' 
      }}>
        <Pie data={chartData} options={options} />
      </Box>
    </Box>
  );
}; 