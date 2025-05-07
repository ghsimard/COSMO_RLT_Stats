import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface GradeData {
  label: string;
  value: number;
  color: string;
}

const GradesPieChart: React.FC = () => {
  // Using the actual grade data from the backend
  const data: GradeData[] = [
    { label: 'Preescolar', value: 1, color: '#FF9F40' },
    { label: 'Grado 1°', value: 1, color: '#4472C4' },
    { label: 'Grado 2°', value: 2, color: '#ED7D31' },
    { label: 'Grado 3°', value: 2, color: '#A5A5A5' },
    { label: 'Grado 5°', value: 1, color: '#5B9BD5' },
    { label: 'Grado 6°', value: 1, color: '#70AD47' },
    { label: 'Grado 7°', value: 1, color: '#264478' },
    { label: 'Grado 9°', value: 1, color: '#636363' },
    { label: 'Grado 10°', value: 2, color: '#997300' },
    { label: 'Grado 11°', value: 2, color: '#2F5597' },
    { label: 'Grado 12°', value: 3, color: '#385723' }
  ];

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradesPieChart; 