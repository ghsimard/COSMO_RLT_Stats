import { CustomPDFKit, addHeader, PieChartData, drawPieChart, drawBarChart, BarChartData } from './pdfUtils';
import { pool } from '../db';

// Helper function to get docentes count
async function getDocentesCount(school: string): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM docentes_form_submissions
      WHERE institucion_educativa = $1
    `;
    const result = await pool.query(query, [school]);
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    console.error('Error fetching docentes count:', error);
    return 0;
  }
}

// Helper function to get estudiantes count
async function getEstudiantesCount(school: string): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM estudiantes_form_submissions
      WHERE institucion_educativa = $1
    `;
    const result = await pool.query(query, [school]);
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    console.error('Error fetching estudiantes count:', error);
    return 0;
  }
}

// Helper function for acudientes count
async function getAcudientesCount(school: string): Promise<number> {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM acudientes_form_submissions
      WHERE institucion_educativa = $1
    `;
    const result = await pool.query(query, [school]);
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    console.error('Error fetching acudientes count:', error);
    return 0;
  }
}

// Helper function to get grades distribution for docentes
async function getGradesDistribution(school: string): Promise<PieChartData[]> {
  try {
    // First, let's log a sample of the raw data
    const sampleQuery = `
      SELECT grados_asignados, institucion_educativa 
      FROM docentes_form_submissions 
      WHERE institucion_educativa = $1
      LIMIT 5;
    `;
    
    const sampleResult = await pool.query(sampleQuery, [school]);
    console.log('Sample data:', JSON.stringify(sampleResult.rows, null, 2));

    const query = `
      WITH RECURSIVE 
      all_categories(category) AS (
        VALUES ('Preescolar'), ('Primaria'), ('Secundaria'), ('Media')
      ),
      grade_data AS (
        SELECT 
          d.institucion_educativa,
          unnest(d.grados_asignados) as grade
        FROM docentes_form_submissions d
        WHERE d.institucion_educativa = $1
      ),
      grade_counts AS (
        SELECT
          CASE 
            WHEN grade = 'Preescolar' OR grade = 'Primera infancia' THEN 'Preescolar'
            WHEN grade IN ('1', '2', '3', '4', '5') THEN 'Primaria'
            WHEN grade IN ('6', '7', '8', '9') THEN 'Secundaria'
            WHEN grade IN ('10', '11', '12') THEN 'Media'
            ELSE 'Otros'
          END as category,
          COUNT(*) as count
        FROM grade_data
        GROUP BY category
      )
      SELECT 
        ac.category,
        COALESCE(gc.count, 0)::integer as count
      FROM all_categories ac
      LEFT JOIN grade_counts gc ON ac.category = gc.category
      ORDER BY 
        CASE ac.category
          WHEN 'Preescolar' THEN 1
          WHEN 'Primaria' THEN 2
          WHEN 'Secundaria' THEN 3
          WHEN 'Media' THEN 4
          ELSE 5
        END;
    `;

    console.log('Executing query with school:', school);
    const result = await pool.query(query, [school]);
    console.log('Query results:', JSON.stringify(result.rows, null, 2));

    // Define colors and labels with a new color scheme
    const categoryConfig: { [key: string]: { color: string, label: string } } = {
      'Preescolar': { color: '#FF9F40', label: 'Preescolar' },  // Warm Orange
      'Primaria': { color: '#4B89DC', label: 'Primaria' },      // Royal Blue
      'Secundaria': { color: '#37BC9B', label: 'Secundaria' },  // Mint Green
      'Media': { color: '#967ADC', label: 'Media' }             // Purple
    };

    // Transform the data
    const chartData = result.rows.map(row => ({
      label: categoryConfig[row.category].label,  // Removed percentage from label
      value: row.count,
      color: categoryConfig[row.category].color
    }));

    // Log the final chart data
    console.log('Final chart data:', JSON.stringify(chartData, null, 2));

    return chartData;
  } catch (error) {
    console.error('Error in getGradesDistribution:', error);
    // Return default data in case of error
    return [
      { label: 'Preescolar', value: 0, color: '#FF9F40' },
      { label: 'Primaria', value: 0, color: '#4B89DC' },
      { label: 'Secundaria', value: 0, color: '#37BC9B' },
      { label: 'Media', value: 0, color: '#967ADC' }
    ];
  }
}

// Helper function to get schedule distribution for docentes
async function getScheduleDistribution(school: string): Promise<PieChartData[]> {
  try {
    const query = `
      SELECT 
        jornada as schedule,
        COUNT(*) as count
      FROM docentes_form_submissions
      WHERE institucion_educativa = $1
      GROUP BY jornada
      ORDER BY jornada;
    `;
    
    const result = await pool.query(query, [school]);
    console.log('Raw schedule data:', JSON.stringify(result.rows, null, 2));
    
    // Map schedules to proper labels and colors with completely distinct colors
    const scheduleMapping: Record<string, { label: string; color: string }> = {
      'MANANA': { label: 'Mañana', color: '#D55E00' },    // Dark Orange
      'MAÑANA': { label: 'Mañana', color: '#D55E00' },    // Dark Orange (alternative spelling)
      'Manana': { label: 'Mañana', color: '#D55E00' },    // Dark Orange (alternative case)
      'Mañana': { label: 'Mañana', color: '#D55E00' },    // Dark Orange (alternative case)
      'TARDE': { label: 'Tarde', color: '#0072B2' },      // Strong Blue
      'Tarde': { label: 'Tarde', color: '#0072B2' },      // Strong Blue (alternative case)
      'NOCHE': { label: 'Noche', color: '#548235' },      // Forest Green
      'Noche': { label: 'Noche', color: '#548235' },      // Forest Green (alternative case)
      'UNICA': { label: 'Única', color: '#7030A0' },      // Purple
      'ÚNICA': { label: 'Única', color: '#7030A0' },      // Purple (alternative spelling)
      'Unica': { label: 'Única', color: '#7030A0' },      // Purple (alternative case)
      'Única': { label: 'Única', color: '#7030A0' }       // Purple (alternative case)
    };

    const chartData = result.rows.map(row => {
      // Debug log to see exact value from database
      console.log('Processing schedule value:', {
        raw: row.schedule,
        mapped: scheduleMapping[row.schedule],
        exists: row.schedule in scheduleMapping
      });
      
      return {
        label: scheduleMapping[row.schedule]?.label || row.schedule,  // Simple label without percentage
        value: parseInt(row.count),
        color: scheduleMapping[row.schedule]?.color || '#000000'
      };
    });

    // If no data was found, return default data
    if (chartData.length === 0) {
      return [
        { label: 'Mañana', value: 0, color: '#D55E00' },
        { label: 'Tarde', value: 0, color: '#0072B2' },
        { label: 'Noche', value: 0, color: '#548235' },
        { label: 'Única', value: 0, color: '#7030A0' }
      ];
    }

    console.log('Final schedule chart data:', JSON.stringify(chartData, null, 2));
    return chartData;
  } catch (error) {
    console.error('Error fetching schedule distribution:', error);
    // Return default data if query fails
    return [
      { label: 'Mañana', value: 0, color: '#D55E00' },
      { label: 'Tarde', value: 0, color: '#0072B2' },
      { label: 'Noche', value: 0, color: '#548235' },
      { label: 'Única', value: 0, color: '#7030A0' }
    ];
  }
}

// Helper functions for estudiantes charts
async function getGradesDistributionForEstudiantes(school: string): Promise<PieChartData[]> {
  try {
    const query = `
      WITH grade_data AS (
        SELECT 
          d.institucion_educativa,
          CASE
            WHEN d.grado_actual = '5' THEN 'Quinto'
            WHEN d.grado_actual = '6' THEN 'Sexto'
            WHEN d.grado_actual = '7' THEN 'Septimo'
            WHEN d.grado_actual = '8' THEN 'Octavo'
            WHEN d.grado_actual = '9' THEN 'Noveno'
            WHEN d.grado_actual = '10' THEN 'Decimo'
            WHEN d.grado_actual = '11' THEN 'Undécimo'
            WHEN d.grado_actual = '12' THEN 'Duodécimo'
            ELSE d.grado_actual
          END as grade
        FROM estudiantes_form_submissions d
        WHERE d.institucion_educativa = $1
      )
      SELECT 
        grade as category,
        COUNT(*) as count
      FROM grade_data
      GROUP BY grade
      ORDER BY 
        CASE grade
          WHEN 'Quinto' THEN 5
          WHEN 'Sexto' THEN 6
          WHEN 'Septimo' THEN 7
          WHEN 'Octavo' THEN 8
          WHEN 'Noveno' THEN 9
          WHEN 'Decimo' THEN 10
          WHEN 'Undécimo' THEN 11
          WHEN 'Duodécimo' THEN 12
          ELSE 99
        END;
    `;

    console.log('Executing grades distribution query for estudiantes:', query);
    const result = await pool.query(query, [school]);
    console.log('Raw grades distribution result:', result.rows);

    // Define colors for each grade
    const gradeMapping: Record<string, { color: string }> = {
      'Quinto': { color: '#4472C4' },    // Blue
      'Sexto': { color: '#ED7D31' },     // Orange
      'Septimo': { color: '#A5A5A5' },   // Gray
      'Octavo': { color: '#FFC000' },    // Yellow
      'Noveno': { color: '#5B9BD5' },    // Light Blue
      'Decimo': { color: '#70AD47' },    // Green
      'Undécimo': { color: '#7030A0' },  // Purple
      'Duodécimo': { color: '#C00000' }  // Dark Red
    };

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    console.log('Total count:', total);

    const chartData = result.rows.map(row => {
      const percentage = total > 0 ? ((parseInt(row.count) / total) * 100).toFixed(1) : '0.0';
      console.log(`Processing category ${row.category}: count=${row.count}, percentage=${percentage}%`);
      return {
        label: row.category,
        value: parseInt(row.count),
        color: gradeMapping[row.category]?.color || '#000000'
      };
    });

    console.log('Final chart data:', chartData);
    return chartData;
  } catch (error) {
    console.error('Error in getGradesDistributionForEstudiantes:', error);
    return [
      { label: 'Preescolar', value: 0, color: '#FF9F40' },
      { label: 'Primaria', value: 0, color: '#4B89DC' },
      { label: 'Secundaria', value: 0, color: '#37BC9B' },
      { label: 'Media', value: 0, color: '#967ADC' }
    ];
  }
}

// Helper function for estudiantes schedule distribution
async function getScheduleDistributionForEstudiantes(school: string): Promise<PieChartData[]> {
  try {
    const query = `
      SELECT 
        jornada as schedule,
        COUNT(*) as count
      FROM estudiantes_form_submissions
      WHERE institucion_educativa = $1
      GROUP BY jornada
      ORDER BY jornada;
    `;
    
    const result = await pool.query(query, [school]);
    
    const scheduleMapping: Record<string, { label: string; color: string }> = {
      'MANANA': { label: 'Mañana', color: '#D55E00' },
      'MAÑANA': { label: 'Mañana', color: '#D55E00' },
      'Manana': { label: 'Mañana', color: '#D55E00' },
      'Mañana': { label: 'Mañana', color: '#D55E00' },
      'TARDE': { label: 'Tarde', color: '#0072B2' },
      'Tarde': { label: 'Tarde', color: '#0072B2' },
      'NOCHE': { label: 'Noche', color: '#548235' },
      'Noche': { label: 'Noche', color: '#548235' },
      'UNICA': { label: 'Única', color: '#7030A0' },
      'ÚNICA': { label: 'Única', color: '#7030A0' },
      'Unica': { label: 'Única', color: '#7030A0' },
      'Única': { label: 'Única', color: '#7030A0' }
    };

    const chartData = result.rows.map(row => {
      return {
        label: scheduleMapping[row.schedule]?.label || row.schedule,
        value: parseInt(row.count),
        color: scheduleMapping[row.schedule]?.color || '#000000'
      };
    });

    if (chartData.length === 0) {
      return [
        { label: 'Mañana', value: 0, color: '#D55E00' },
        { label: 'Tarde', value: 0, color: '#0072B2' },
        { label: 'Noche', value: 0, color: '#548235' },
        { label: 'Única', value: 0, color: '#7030A0' }
      ];
    }

    return chartData;
  } catch (error) {
    console.error('Error fetching schedule distribution for estudiantes:', error);
    return [
      { label: 'Mañana', value: 0, color: '#D55E00' },
      { label: 'Tarde', value: 0, color: '#0072B2' },
      { label: 'Noche', value: 0, color: '#548235' },
      { label: 'Única', value: 0, color: '#7030A0' }
    ];
  }
}

// Helper function for grados_estudiantes distribution (for acudientes)
async function getGradosEstudiantesDistribution(school: string): Promise<PieChartData[]> {
  try {
    const query = `
      WITH grade_data AS (
        SELECT 
          unnest(grados_estudiantes) as grade
        FROM acudientes_form_submissions
        WHERE institucion_educativa = $1
      )
      SELECT 
        grade as category,
        COUNT(*) as count
      FROM grade_data
      GROUP BY grade
      ORDER BY 
        CASE grade
          WHEN 'Preescolar' THEN 0
          WHEN 'Primera infancia' THEN 0
          ELSE CAST(REGEXP_REPLACE(grade, '[^0-9]', '', 'g') AS INTEGER)
        END;
    `;

    const result = await pool.query(query, [school]);

    // Define colors for each grade
    const gradeColors: { [key: string]: string } = {
      'Preescolar': '#FF9F40',      // Warm Orange
      'Primera infancia': '#FF9F40', // Same as Preescolar
      '1': '#4472C4',               // Blue
      '2': '#ED7D31',               // Orange
      '3': '#A5A5A5',               // Gray
      '4': '#FFC000',               // Yellow
      '5': '#5B9BD5',               // Light Blue
      '6': '#70AD47',               // Green
      '7': '#264478',               // Dark Blue
      '8': '#9E480E',               // Dark Orange
      '9': '#636363',               // Dark Gray
      '10': '#997300',              // Dark Yellow
      '11': '#2F5597',              // Dark Blue
      '12': '#385723'               // Dark Green
    };

    // Transform the data
    const chartData = result.rows.map(row => {
      const grade = row.category;
      const label = grade === 'Preescolar' || grade === 'Primera infancia' ? grade : `Grado ${grade}`;
      return {
        label: label,
        value: parseInt(row.count),
        color: gradeColors[grade] || '#CCCCCC'
      };
    });

    // Return default data if no results
    if (chartData.length === 0) {
      return [
        { label: 'Preescolar', value: 0, color: '#FF9F40' },
        { label: 'Grado 1', value: 0, color: '#4472C4' },
        { label: 'Grado 2', value: 0, color: '#ED7D31' },
        { label: 'Grado 3', value: 0, color: '#A5A5A5' },
        { label: 'Grado 4', value: 0, color: '#FFC000' },
        { label: 'Grado 5', value: 0, color: '#5B9BD5' },
        { label: 'Grado 6', value: 0, color: '#70AD47' },
        { label: 'Grado 7', value: 0, color: '#264478' },
        { label: 'Grado 8', value: 0, color: '#9E480E' },
        { label: 'Grado 9', value: 0, color: '#636363' },
        { label: 'Grado 10', value: 0, color: '#997300' },
        { label: 'Grado 11', value: 0, color: '#2F5597' },
        { label: 'Grado 12', value: 0, color: '#385723' }
      ];
    }

    return chartData;
  } catch (error) {
    console.error('Error in getGradosEstudiantesDistribution:', error);
    return [
      { label: 'Preescolar', value: 0, color: '#FF9F40' },
      { label: 'Grado 1', value: 0, color: '#4472C4' },
      { label: 'Grado 2', value: 0, color: '#ED7D31' },
      { label: 'Grado 3', value: 0, color: '#A5A5A5' },
      { label: 'Grado 4', value: 0, color: '#FFC000' },
      { label: 'Grado 5', value: 0, color: '#5B9BD5' },
      { label: 'Grado 6', value: 0, color: '#70AD47' },
      { label: 'Grado 7', value: 0, color: '#264478' },
      { label: 'Grado 8', value: 0, color: '#9E480E' },
      { label: 'Grado 9', value: 0, color: '#636363' },
      { label: 'Grado 10', value: 0, color: '#997300' },
      { label: 'Grado 11', value: 0, color: '#2F5597' },
      { label: 'Grado 12', value: 0, color: '#385723' }
    ];
  }
}

// Main function to generate the Encuestados page
export const generateEncuestadosPage = async (doc: CustomPDFKit, school: string): Promise<void> => {
  // Add a new page with header
  doc.addPage();
  addHeader(doc);

  const startX = 75;
  const pageContentWidth = doc.page.width - (startX * 2);  // Renamed from textWidth to pageContentWidth
  const startY = doc.y + 15;
  const labelWidth = 200;  // Width for right-aligned labels
  const valueX = startX + labelWidth + 10;  // Fixed starting position for values

  // Reset cursor position
  doc.x = startX;
  doc.y = startY;

  // Add ENCUESTADOS title
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('ENCUESTADOS', startX, doc.y, {
       align: 'left'
     })
     .moveDown(0.5);

  // Add DOCENTES title with background
  const docentesY = doc.y;
  const titleHeight = 20;  // Height for title background
  
  // Draw background rectangle
  doc.save()
     .fillColor('#1E3A8A')  // Dark blue background
     .rect(startX, docentesY, doc.page.width - (startX * 2), titleHeight)
     .fill()
     .restore();

  const docentesCount = await getDocentesCount(school);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('white')  // White text for contrast
     .text('DOCENTES:', startX, docentesY + 4, {
       width: labelWidth,
       align: 'right'
     });
  
  // Add docentes count at fixed position
  doc.font('Helvetica')
     .fillColor('white')  // White text for the count
     .text(`${docentesCount} encuestados`, valueX, docentesY + 4)
     .moveDown(0.0);

  // Add charts section
  const pageHeight = doc.page.height;
  const chartMargin = 30;
  const chartWidth = (doc.page.width - chartMargin * 3) / 2.5; // Reduced width
  const chartHeight = 150; // Reduced height
  const startChartY = doc.y + 10;  // Reduced from +20 to +5

  // Draw first pie chart (Grades)
  const gradesData = await getGradesDistribution(school);
  drawPieChart(
    doc,
    gradesData,
    startX + chartWidth/3,
    startChartY + chartHeight/2,
    chartWidth/4,
    '¿En qué grados tiene clases?',
    true
  );

  // Draw vertical separator line
  const separatorX = doc.page.width / 2;  // Center of the page
  const separatorStartY = startChartY + 10;
  const separatorEndY = startChartY + chartHeight - 10;
  doc.save()
     .moveTo(separatorX, separatorStartY)
     .lineTo(separatorX, separatorEndY)
     .strokeColor('#CCCCCC')  // Light gray color
     .lineWidth(1)
     .dash(5, { space: 5 })   // Dashed line
     .stroke()
     .restore();

  // Draw second pie chart (Schedule)
  const scheduleData = await getScheduleDistribution(school);
  drawPieChart(
    doc,
    scheduleData,
    startX + chartWidth * 1.4 + chartMargin, // Decreased multiplier from 1.8 to 1.4 to move chart more to the left
    startChartY + chartHeight/2,
    chartWidth/4,
    '¿En qué jornada tiene clases?'
  );

  // Draw horizontal separator line between pie charts and bar charts
  const horizontalSeparatorY = startChartY + chartHeight - 10; // Changed from -25 to -5 to move line lower
  doc.save()
     .moveTo(startX, horizontalSeparatorY)
     .lineTo(doc.page.width - startX, horizontalSeparatorY)
     .strokeColor('#CCCCCC')  // Light gray color
     .lineWidth(1)
     .dash(5, { space: 5 })   // Dashed line
     .stroke()
     .restore();

  // Draw first bar chart (Years in IE)
  const yearsData: BarChartData[] = [
    { label: 'Menos de 1', value: 1, color: '#4472C4' },  // Blue
    { label: '1 año', value: 0, color: '#ED7D31' },       // Orange
    { label: '2 años', value: 1, color: '#A5A5A5' },      // Gray
    { label: '3 años', value: 3, color: '#FFC000' },      // Yellow
    { label: '4 años', value: 1, color: '#5B9BD5' },      // Light Blue
    { label: '5 años', value: 2, color: '#70AD47' },      // Green
    { label: '6 o mas', value: 8, color: '#7030A0' }      // Purple
  ];
  drawBarChart(
    doc,
    yearsData,
    startX,
    startChartY + chartHeight - 5,  // Changed from +5 to -5 to move up closer to line
    chartWidth,
    chartHeight,
    '¿Cuántos años lleva en la IE?',
    true // isHorizontal
  );

  // Draw second bar chart (Feedback)
  const feedbackData: BarChartData[] = [
    { label: 'Ninguno', value: 0, color: '#A5A5A5' },     // Gray
    { label: 'Estudiantes', value: 9, color: '#4472C4' },  // Blue
    { label: 'Coordinador/a', value: 12, color: '#FFC000' }, // Yellow
    { label: 'Otros docentes', value: 6, color: '#70AD47' }, // Green
    { label: 'Familias', value: 7, color: '#ED7D31' },      // Orange
  ];
  drawBarChart(
    doc,
    feedbackData,
    startX + chartWidth + chartMargin,
    startChartY + chartHeight - 5,  // Changed from +5 to -5 to move up closer to line
    chartWidth,
    chartHeight,
    'Usted recibe retroalimentación de',
    true // isHorizontal
  );

  const barChartsEndY = startChartY + chartHeight + chartHeight - 10;

  // Add ESTUDIANTES title with background
  const estudiantesY = barChartsEndY - 10;  // Changed from +10 to -10 to move up closer to charts
  
  // Draw background rectangle
  doc.save()
     .fillColor('#1E3A8A')  // Dark blue background
     .rect(startX, estudiantesY, doc.page.width - (startX * 2), titleHeight)
     .fill()
     .restore();

  const estudiantesCount = await getEstudiantesCount(school);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('white')  // White text for contrast
     .text('ESTUDIANTES:', startX, estudiantesY + 4, {
       width: labelWidth,
       align: 'right'
     });

  // Add estudiantes count at fixed position
  doc.font('Helvetica')
     .fillColor('white')  // White text for the count
     .text(`${estudiantesCount} encuestados`, valueX, estudiantesY + 4)
     .moveDown(0.3);

  // Add charts section for ESTUDIANTES with minimal spacing
  const estudiantesChartY = doc.y + 2;  // Reduced from +5 to +2

  // Draw first pie chart (Grades) for estudiantes
  const estudiantesGradesData = await getGradesDistributionForEstudiantes(school);
  drawPieChart(
    doc,
    estudiantesGradesData,
    startX + chartWidth/3,
    estudiantesChartY + chartHeight/2,
    chartWidth/4,
    '¿En qué grado te encuentras?',
    true,
    true,  // Place legend below
    true   // Use multi-line legend
  );

  // Draw vertical separator line closer to pie chart 3
  const estudiantesSeparatorX = startX + chartWidth/3 + chartWidth/2;  // Moved closer to pie 3
  const estudiantesSeparatorStartY = estudiantesChartY + 25;
  const estudiantesSeparatorEndY = estudiantesChartY + chartHeight - 25;
  doc.save()
     .moveTo(estudiantesSeparatorX, estudiantesSeparatorStartY)
     .lineTo(estudiantesSeparatorX, estudiantesSeparatorEndY)
     .strokeColor('#CCCCCC')
     .lineWidth(1)
     .dash(5, { space: 5 })
     .stroke()
     .restore();

  // Draw second pie chart (Schedule) for estudiantes, moved closer to separator
  const estudiantesScheduleData = await getScheduleDistributionForEstudiantes(school);
  drawPieChart(
    doc,
    estudiantesScheduleData,
    startX + chartWidth * 1.0 + chartMargin,  // Reduced from 1.2 to 1.0 to move it more left
    estudiantesChartY + chartHeight/2,
    chartWidth/4,
    '¿En qué jornada tiene clases?',
    false,
    true,  // Place legend below
    false  // Use single-line legend
  );

  // Draw right vertical separator line
  const rightSeparatorX = startX + chartWidth * 1.3 + chartMargin;  // Reduced from 1.4 to 1.2 to move line closer to left pie chart
  const rightSeparatorStartY = estudiantesChartY + 25;
  const rightSeparatorEndY = estudiantesChartY + chartHeight - 25;
  doc.save()
     .moveTo(rightSeparatorX, rightSeparatorStartY)
     .lineTo(rightSeparatorX, rightSeparatorEndY)
     .strokeColor('#CCCCCC')
     .lineWidth(1)
     .dash(5, { space: 5 })
     .stroke()
     .restore();

  // Draw years bar chart on the right side
  const yearsDataRight: BarChartData[] = [
    { label: 'Menos de 1', value: 1, color: '#4472C4' },  // Blue
    { label: '1 año', value: 0, color: '#ED7D31' },       // Orange
    { label: '2 años', value: 1, color: '#A5A5A5' },      // Gray
    { label: '3 años', value: 3, color: '#FFC000' },      // Yellow
    { label: '4 años', value: 1, color: '#5B9BD5' },      // Light Blue
    { label: '5 años', value: 2, color: '#70AD47' },      // Green
    { label: '6 o mas', value: 8, color: '#7030A0' }      // Purple
  ];
  drawBarChart(
    doc,
    yearsDataRight,
    rightSeparatorX + 20,  // Keep 20 points padding from separator
    estudiantesChartY - 8,
    chartWidth/1.5,
    chartHeight,
    '¿Cuántos años lleva en la IE?',
    true // isHorizontal
  );

  // Calculate position for horizontal separator line after legends
  // Account for multi-line legend height (3 rows * 15 points spacing) plus pad
  const legendHeight = 3 * 15 + 5;  // Reduced padding from 20 to 5 points
  const estudiantesChartsEndY = estudiantesChartY + chartHeight + legendHeight;
  
  // Add ACUDIENTES title with background
  const acudientesY = estudiantesChartsEndY - 15;  // Changed from +10 to -15 to move up closer to charts
  
  // Draw background rectangle
  doc.save()
     .fillColor('#1E3A8A')  // Dark blue background
     .rect(startX, acudientesY, doc.page.width - (startX * 2), titleHeight)
     .fill()
     .restore();

  // Add ACUDIENTES title and count
  const acudientesCount = await getAcudientesCount(school);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('white')  // White text for contrast
     .text('ACUDIENTES:', startX, acudientesY + 4, {
       width: labelWidth,
       align: 'right'
     });

  // Add acudientes count at fixed position
  doc.font('Helvetica')
     .fillColor('white')  // White text for the count
     .text(`${acudientesCount} encuestados`, valueX, acudientesY + 4)
     .moveDown(1);

  // Draw stacked bar chart for grados_estudiantes
  const stackedBarY = acudientesY + 50;  // Increased back to 50 points padding
  const stackedBarHeight = 20;  // Reduced from 25 to 20
  const stackedBarData = await getGradosEstudiantesDistribution(school);
  const totalStudents = stackedBarData.reduce((sum, item) => sum + item.value, 0);
  
  // Draw title for stacked bar
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor('black')  // Set color to black
     .text('¿En qué grado se encuentran los estudiantes que representa?', startX, stackedBarY - 20, {
       width: doc.page.width - (startX * 2),  // Full page width minus margins
       align: 'left'
     });

  // Draw the stacked bar
  let currentX = startX;
  const fullWidth = doc.page.width - (startX * 2);  // Full page width minus margins
  stackedBarData.forEach((item, index) => {
    const barWidth = (item.value / totalStudents) * fullWidth;
    
    // Draw bar segment
    doc.rect(currentX, stackedBarY, barWidth, stackedBarHeight)
       .fillColor(item.color)
       .fill();

    // Add percentage label if segment is wide enough
    const percentage = Math.round((item.value / totalStudents) * 100);
    if (percentage > 5) {  // Only show label if segment is > 5%
      const percentageTextWidth = doc.widthOfString(`${percentage}%`);  // Get width of text
      const textX = currentX + (barWidth - percentageTextWidth)/2;  // Center text in segment
      const textY = stackedBarY + (stackedBarHeight/2); // Center text in segment
      
      doc.fillColor('white')
         .fontSize(8)
         .text(`${percentage}%`,
           textX,
           textY,
           { 
             lineBreak: false,
             baseline: 'middle',
             characterSpacing: 0
           });
    }

    currentX += barWidth;
  });

  // Draw legend below stacked bar
  const legendY = stackedBarY + stackedBarHeight + 10;
  const legendItemWidth = 45;  // Reduced width to fit all items in one line
  const legendSpacing = 5;     // Added small spacing between items
  
  // Center the legend
  const totalLegendWidth = stackedBarData.length * (legendItemWidth + legendSpacing) - legendSpacing;
  const legendStartX = (doc.page.width - totalLegendWidth) / 2;
  
  stackedBarData.forEach((item, index) => {
    const legendItemX = legendStartX + (index * (legendItemWidth + legendSpacing));

    // Draw color box
    doc.rect(legendItemX, legendY, 8, 8)
       .fillColor(item.color)
       .fill();

    // Draw label with smaller font
    doc.fillColor('black')
       .fontSize(6)  // Reduced font size further
       .text(item.label,
         legendItemX + 12,
         legendY,
         { width: legendItemWidth - 12 });
  });

  // Calculate content width for the note section
  const contentWidth = doc.page.width - (startX * 2);  // Full page width minus margins

  // Add note text below legend with exclamation mark
  const noteY = legendY + 30;  // Add some space after the legend
  
  // Draw exclamation mark
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#FF0000')  // Red color
     .text('!', startX + 12, noteY);

  // Add instruction box with solid border
  const notePadding = 10;
  const iconWidth = 30;
  const textStartX = startX + iconWidth;
  const noteTextWidth = contentWidth - iconWidth;  // Renamed from textWidth to noteTextWidth

  // Draw border around text (solid line)
  doc.lineWidth(0.5)
     .rect(textStartX, noteY, noteTextWidth, 30)  // Use noteTextWidth here
     .stroke();

  // Add note text
  doc.fontSize(10)
     .font('Helvetica-Bold')  // Made bold
     .fillColor('#FF0000')  // Red color
     .text('Analice la composición de los distintos grupos encuestados y tenga encuenta que esta muestra no representa la totalidad de su IE.',
       textStartX + notePadding, noteY + 8, {
         width: noteTextWidth - (notePadding * 2),  // Use noteTextWidth here
         align: 'center'
       });
}; 