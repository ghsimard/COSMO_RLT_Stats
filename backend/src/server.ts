import { Pool } from 'pg';
import { PieChartData } from './types';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Add helper functions to get chart data
async function getGradesDistribution(school: string): Promise<PieChartData[]> {
  try {
    console.log('\n=== Getting grades distribution for school:', school, '===');

    // First, let's log a sample of the raw data to help with debugging
    const sampleQuery = `
      SELECT grados_asignados 
      FROM docentes_form_submissions 
      WHERE institucion_educativa = $1 
      LIMIT 3;
    `;
    const sampleResult = await pool.query(sampleQuery, [school]);
    console.log('\nSample raw data:', JSON.stringify(sampleResult.rows, null, 2));

    // Main query to get grade distribution
    const query = `
      WITH grade_counts AS (
        SELECT 
          trim(g.grade) as grade,
          COUNT(*) as count
        FROM docentes_form_submissions d
        CROSS JOIN LATERAL unnest(d.grados_asignados) as g(grade)
        WHERE d.institucion_educativa = $1
        GROUP BY trim(g.grade)
      )
      SELECT 
        CASE 
          WHEN grade ~ '^4' THEN '4°'
          WHEN grade ~ '^5' THEN '5°'
          WHEN grade ~ '^6' THEN '6°'
          ELSE grade
        END as grade,
        sum(count)::integer as count
      FROM grade_counts
      GROUP BY 
        CASE 
          WHEN grade ~ '^4' THEN '4°'
          WHEN grade ~ '^5' THEN '5°'
          WHEN grade ~ '^6' THEN '6°'
          ELSE grade
        END
      ORDER BY grade;
    `;

    console.log('\nExecuting query:', query.replace(/\s+/g, ' '));
    console.log('School parameter:', school);
    
    const result = await pool.query(query, [school]);
    console.log('\nQuery results:', JSON.stringify(result.rows, null, 2));

    // Define colors for each grade
    const gradeColors: { [key: string]: string } = {
      '4°': '#FFC000',  // Yellow
      '5°': '#5B9BD5',  // Light Blue
      '6°': '#70AD47'   // Green
    };

    // Transform the data and ensure we have all expected grades
    const expectedGrades = ['4°', '5°', '6°'];
    const resultMap = new Map(result.rows.map(row => [row.grade, parseInt(row.count)]));
    
    const chartData = expectedGrades.map(grade => ({
      label: grade,
      value: resultMap.get(grade) || 0,
      color: gradeColors[grade]
    }));

    console.log('\nFinal chart data:', JSON.stringify(chartData, null, 2));
    return chartData;
  } catch (error) {
    console.error('Error in getGradesDistribution:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    // Return default data structure with zero values
    return [
      { label: '4°', value: 0, color: '#FFC000' },
      { label: '5°', value: 0, color: '#5B9BD5' },
      { label: '6°', value: 0, color: '#70AD47' }
    ];
  }
} 