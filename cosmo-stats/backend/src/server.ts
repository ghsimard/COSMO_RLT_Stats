import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { FrequencyData, SectionConfig, GridItem, FrequencyResult } from './types';
import { QueryResult } from 'pg';
import PDFKit from 'pdfkit';
import path from 'path';

const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Test query to check table access and column names
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'docentes_form_submissions\'')
  .then((result: QueryResult) => {
    console.log('Columns in docentes_form_submissions:', result.rows.map((row: { column_name: string }) => row.column_name));
  })
  .catch((err: Error) => {
    console.error('Error querying column names:', err);
  });

// Test query to check table access
pool.query('SELECT COUNT(*) FROM docentes_form_submissions')
  .then((result: QueryResult) => {
    console.log('Successfully queried docentes_form_submissions. Row count:', result.rows[0].count);
  })
  .catch((err: Error) => {
    console.error('Error querying docentes_form_submissions:', err);
  });

// Test query to check column names in rectores table
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'rectores\' ORDER BY ordinal_position')
  .then((result: QueryResult) => {
    console.log('All columns in rectores table:');
    result.rows.forEach((row: { column_name: string }) => {
      console.log('-', row.column_name);
    });
  })
  .catch((err: Error) => {
    console.error('Error querying rectores column names:', err);
  });

const sections: Record<string, SectionConfig> = {
  comunicacion: {
    title: 'COMUNICACIÓN',
    items: [
      {
        displayText: 'Los docentes tienen la disposición de dialogar con las familias sobre los aprendizajes de los estudiantes en espacios adicionales a la entrega de notas.',
        questionMappings: {
          docentes: 'Tengo la disposición de dialogar con los acudientes sobre los aprendizajes de los estudiantes en momentos adicionales a la entrega de notas.',
          estudiantes: 'Mis profesores están dispuestos a hablar con mis acudientes sobre cómo me está yendo en el colegio, en momentos diferentes a la entrega de notas.',
          acudientes: 'Los profesores tienen la disposición para hablar conmigo sobre los aprendizajes de los estudiantes en momentos adicionales a la entrega de notas.'
        }
      },
      {
        displayText: 'Los docentes promueven el apoyo de las familias a los estudiantes por medio de actividades para hacer en casa.',
        questionMappings: {
          docentes: 'Promuevo el apoyo de los acudientes al aprendizaje de los estudiantes, a través de actividades académicas y lúdicas para realizar en espacios fuera de la institución educativa.',
          estudiantes: 'Mis profesores me dejan actividades para hacer en casa, las cuales necesitan el apoyo de mis acudientes.',
          acudientes: 'Los profesores promueven actividades para que apoye en su proceso de aprendizaje a los estudiantes que tengo a cargo.'
        }
      },
      {
        displayText: 'En la Institución Educativa se promueve la participación de docentes, familias y estudiantes en la toma de decisiones sobre los objetivos institucionales.',
        questionMappings: {
          docentes: 'En el colegio se promueve mi participación en la toma de decisiones sobre las metas institucionales.',
          estudiantes: 'En mi colegio se promueve mi participación en la toma de decisiones sobre las metas institucionales.',
          acudientes: 'En el colegio se promueve mi participación en la toma de decisiones sobre las metas institucionales.'
        }
      },
      {
        displayText: 'En la Institución Educativa se hace reconocimiento público de las prácticas pedagógicas innovadoras de los docentes.',
        questionMappings: {
          docentes: 'En el colegio se hace reconocimiento público de nuestras prácticas pedagógicas exitosas e innovadoras.',
          estudiantes: 'En mi colegio reconocen públicamente las actividades y esfuerzos exitosos que hacen los profesores para que nosotros aprendamos.',
          acudientes: 'En el colegio se hace reconocimiento público de las prácticas pedagógicas exitosas e innovadoras de los profesores.'
        }
      },
      {
        displayText: 'Los directivos docentes y los diferentes actores de la comunidad se comunican de manera asertiva.',
        questionMappings: {
          docentes: 'La comunicación que tengo con los directivos docentes del colegio es respetuosa y clara.',
          estudiantes: 'La comunicación que tengo con los directivos de mi colegio es respetuosa y clara.',
          acudientes: 'La comunicación que tengo con los directivos docentes del colegio es respetuosa y clara.'
        }
      },
      {
        displayText: 'Los docentes de la Institución Educativa se comunican de manera asertiva.',
        questionMappings: {
          docentes: 'La comunicación que tengo con otros docentes es asertiva.',
          estudiantes: 'La comunicación entre mis profesores es respetuosa y clara.',
          acudientes: 'La comunicación que tengo con los directivos docentes del colegio es respetuosa y clara.'
        }
      }
    ]
  },
  practicas_pedagogicas: {
    title: 'PRÁCTICAS PEDAGÓGICAS',
    items: [
      {
        displayText: 'Los intereses y las necesidades de los estudiantes son tenidos en cuenta en la planeación de las clases.',
        questionMappings: {
          docentes: 'Cuando preparo mis clases tengo en cuenta los intereses y necesidades de los estudiantes.',
          estudiantes: 'Los profesores tienen en cuenta mis intereses y afinidades para escoger lo que vamos a hacer en clase.',
          acudientes: 'Los profesores tienen en cuenta los intereses y necesidades de los estudiantes para escoger los temas que se van a tratar en clase.'
        }
      },
      {
        displayText: 'Los docentes de la Institución Educativa participan en proyectos transversales con otros colegas.',
        questionMappings: {
          docentes: 'Me articulo con profesores de otras áreas y niveles para llevar a cabo proyectos pedagógicos que mejoren los aprendizajes de los estudiantes.',
          estudiantes: 'Los profesores trabajan juntos en proyectos para hacer actividades que nos ayudan a aprender más y mejor.',
          acudientes: 'NA'
        }
      },
      {
        displayText: 'Para el desarrollo de los planes de aula, los docentes utilizan espacios alternativos como bibliotecas, parques, laboratorios, museos, etc.',
        questionMappings: {
          docentes: 'Utilizo diferentes espacios dentro y fuera del colegio como la biblioteca, el laboratorio o el parque para el desarrollo de mis clases.',
          estudiantes: 'Los profesores me llevan a otros sitios fuera del salón o del colegio para hacer las clases (por ejemplo, la biblioteca, el laboratorio, el parque, el museo, el río, etc.).',
          acudientes: 'A los estudiantes los llevan a lugares diferentes al salón para hacer sus clases (por ejemplo, la biblioteca, el laboratorio, el parque, el museo, el río, etc.).'
        }
      },
      {
        displayText: 'Los docentes logran cumplir los objetivos y el desarrollo de las clases que tenían planeados.',
        questionMappings: {
          docentes: 'Logro cumplir los objetivos y el desarrollo que planeo para mis clases.',
          estudiantes: 'Mis profesores logran hacer sus clases de manera fluida.',
          acudientes: 'NA'
        }
      },
      {
        displayText: 'Los docentes demuestran que confían en los estudiantes y que creen en sus capacidades y habilidades.',
        questionMappings: {
          docentes: 'Demuestro a mis estudiantes que confío en ellos y que creo en sus capacidades y habilidades.',
          estudiantes: 'Mis profesores me demuestran que confían en mí y creen en mis habilidades y capacidades.',
          acudientes: 'Los profesores demuestran que confían en los estudiantes y que creen en sus capacidades y habilidades.'
        }
      },
      {
        displayText: 'Los docentes adaptan su enseñanza para que todas y todos aprendan independiente de su entorno social, afectivo y sus capacidades físicas/cognitivas.',
        questionMappings: {
          docentes: 'Desarrollo mis clases con enfoque diferencial para garantizar el derecho a la educación de todas y todos mis estudiantes, independiente de su entorno social, afectivo y sus capacidades físicas y cognitivas.',
          estudiantes: 'Mis profesores hacen las clases de manera que nos permiten aprender a todas y todos sin importar nuestras diferencias (discapacidad, situaciones familiares o sociales).',
          acudientes: 'Los profesores del colegio hacen las clases garantizando el derecho a la educación de los estudiantes que viven condiciones o situaciones especiales (por ejemplo, alguna discapacidad, que sean desplazados o que entraron tarde al curso).'
        }
      },
      {
        displayText: 'Al evaluar, los docentes tienen en cuenta las emociones, en conjunto con el aprendizaje y el comportamiento.',
        questionMappings: {
          docentes: 'Cuando evalúo a mis estudiantes tengo en cuenta su dimensión afectiva y emocional, además de la cognitivas y comportamental.',
          estudiantes: 'Cuando mis profesores me evalúan tienen en cuenta mis emociones, además de mis aprendizajes y comportamiento.',
          acudientes: 'Cuando los profesores evalúan a los estudiantes tienen en cuenta su dimensión afectiva y emocional, además de la cognitiva y la comportamental.'
        }
      },
      {
        displayText: 'La Institución Educativa organiza o participa en actividades deportivas, culturales o académicas con otros colegios.',
        questionMappings: {
          docentes: 'Los profesores organizamos con otros colegios o instituciones actividades deportivas, académicas y culturales.',
          estudiantes: 'Participamos en campeonatos deportivos, ferias y olimpiadas con otros colegios o instituciones.',
          acudientes: 'El colegio organiza o participa en actividades como torneos, campeonatos, olimpiadas o ferias con otros colegios o instituciones.'
        }
      }
    ]
  },
  convivencia: {
    title: 'CONVIVENCIA',
    items: [
      {
        displayText: 'Todos los estudiantes son tratados con respeto independiente de sus creencias religiosas, género, orientación sexual, etnia y capacidades o talentos.',
        questionMappings: {
          docentes: 'En el colegio mis estudiantes son tratados con respeto, independiente de sus creencias religiosas, género, orientación sexual, grupo étnico y capacidades o talentos de los demás.',
          estudiantes: 'En el colegio mis compañeros y yo somos tratados con respeto sin importar nuestras creencias religiosas, género, orientación sexual, grupo étnico y capacidades o talentos.',
          acudientes: 'En el colegio los estudiantes son respetuosos y solidarios entre ellos, comprendiendo y aceptando las creencias religiosas, el género, la orientación sexual, el grupo étnico y las capacidades o talentos de los demás.'
        }
      },
      {
        displayText: 'Docentes y estudiantes establecen acuerdos de convivencia al comenzar el año escolar.',
        questionMappings: {
          docentes: 'Establezco con mis estudiantes acuerdos de convivencia al comenzar el año escolar.',
          estudiantes: 'Mis profesores establecen conmigo y mis compañeros acuerdos de convivencia al comienzo del año.',
          acudientes: 'Los profesores establecen acuerdos de convivencia con los estudiantes al comenzar el año escolar.'
        }
      },
      {
        displayText: 'Las opiniones y propuestas de familias, estudiantes y docentes son tenidas en cuenta cuando se construyen los acuerdos de convivencia en el colegio.',
        questionMappings: {
          docentes: 'Mis opiniones, propuestas y sugerencias se tienen en cuenta cuando se construyen acuerdos de convivencia en el colegio.',
          estudiantes: 'Mis opiniones, propuestas y sugerencias se tienen en cuenta cuando se construyen acuerdos de convivencia en el colegio.',
          acudientes: 'Mis opiniones, propuestas y sugerencias se tienen en cuenta cuando se construyen acuerdos de convivencia en el colegio.'
        }
      },
      {
        displayText: 'Los docentes son tratados con respeto por los estudiantes.',
        questionMappings: {
          docentes: 'Los estudiantes me tratan con respeto a mí y a mis otros compañeros docentes, directivos y administrativos.',
          estudiantes: 'Mis compañeros y yo tratamos con respeto a los profesores, directivos y administrativos del colegio.',
          acudientes: 'Los estudiantes tratan con respeto a los profesores, directivos y administrativos del colegio.'
        }
      },
      {
        displayText: 'Cada miembro de la comunidad educativa se siente escuchado y comprendido por los demás.',
        questionMappings: {
          docentes: 'En el colegio me siento escuchado/a y comprendido/a por otros docentes, los directivos, los estudiantes y los acudientes.',
          estudiantes: 'En el colegio me siento escuchado/a y comprendido/a por los profesores, los directivos, los estudiantes y otros acudientes.',
          acudientes: 'NA'
        }
      },
      {
        displayText: 'En la Institución Educativa, las personas se sienten apoyadas para resolver los conflictos que se dan y se generan aprendizajes a partir de estos.',
        questionMappings: {
          docentes: 'En el colegio recibo apoyo para resolver los conflictos que surgen y generar aprendizajes a partir de estos.',
          estudiantes: 'En el colegio recibo apoyo para resolver los conflictos que se dan y generar aprendizajes a partir de estos.',
          acudientes: 'En el colegio recibo apoyo para resolver los conflictos que se dan y generar aprendizajes a partir de estos.'
        }
      }
    ]
  }
};

// Get the correct column name based on the section
const getColumnName = (section: string) => {
  switch (section.toLowerCase()) {
    case 'comunicacion':
      return 'comunicacion';
    case 'practicas_pedagogicas':
      return 'practicas_pedagogicas';
    case 'convivencia':
      return 'convivencia';
    default:
      return section.toLowerCase();
  }
};

async function calculateFrequencies(tableName: string, question: string, section: string, school?: string): Promise<FrequencyResult> {
  if (question === 'NA') {
    return { S: -1, A: -1, N: -1 };
  }

  const columnName = getColumnName(section);
  let query = `
    SELECT 
      key as question,
      LOWER(TRIM(value)) as rating,
      COUNT(*) as count
    FROM ${tableName},
      jsonb_each_text(${columnName}) as x(key, value)
    WHERE key = $1
  `;
  
  const queryParams = [question];
  
  // Add school filter if provided
  if (school) {
    query += ` AND institucion_educativa = $2`;
    queryParams.push(school);
  }
  
  query += `
    GROUP BY key, value
    ORDER BY key, value;
  `;

  try {
    // Log the exact query parameters
    console.log(`\nDEBUG - Query Parameters:`);
    console.log(`Table: ${tableName}`);
    console.log(`Question: "${question}"`);
    console.log(`Section: ${section}`);
    console.log(`Column: ${columnName}`);
    console.log(`School: ${school || 'All schools'}`);

    const { rows } = await pool.query(query, queryParams);
    
    // Log raw results
    console.log(`Raw Results:`, JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log(`WARNING: No results found for question "${question}" in table ${tableName}${school ? ` for school ${school}` : ''}`);
      // Try a broader query to see what questions exist
      const checkQuery = `
        SELECT DISTINCT key, COUNT(DISTINCT value) as value_count
        FROM ${tableName},
          jsonb_each_text(${columnName}) as x(key, value)
        ${school ? `WHERE institucion_educativa = $1` : ''}
        GROUP BY key
        LIMIT 5;
      `;
      const { rows: checkRows } = await pool.query(checkQuery, school ? [school] : []);
      console.log(`Sample questions in ${tableName} with value counts:`, checkRows);
      return { S: -1, A: -1, N: -1 }; // Indicate no data available
    }

    let total = 0;
    const counts: Record<string, number> = { S: 0, A: 0, N: 0 };
    const unrecognizedRatings: Set<string> = new Set();

    rows.forEach((row: { rating: string; count: string }) => {
      const count = parseInt(row.count);
      const rating = row.rating.toLowerCase().trim();
      console.log(`Processing: Rating="${rating}", Count=${count}`);
      
      total += count;
      if (rating.includes('siempre')) {
        counts.S += count;
      } else if (rating.includes('veces')) {
        counts.A += count;
      } else if (rating.includes('nunca')) {
        counts.N += count;
      } else {
        unrecognizedRatings.add(rating);
        console.log(`WARNING: Unrecognized rating "${rating}"`);
      }
    });

    if (unrecognizedRatings.size > 0) {
      console.log(`WARNING: Found unrecognized ratings:`, Array.from(unrecognizedRatings));
    }

    // Log the totals
    console.log(`Totals - S: ${counts.S}, A: ${counts.A}, N: ${counts.N}, Total: ${total}`);

    if (total === 0) {
      console.log(`WARNING: No valid responses found for question "${question}"`);
      return { S: -1, A: -1, N: -1 }; // Indicate no valid data
    }

    const result = {
      S: Math.round((counts.S / total) * 100),
      A: Math.round((counts.A / total) * 100),
      N: Math.round((counts.N / total) * 100)
    };

    console.log(`Final percentages:`, result);
    return result;
  } catch (error) {
    console.error(`Error in calculateFrequencies:`, error);
    console.error(`Failed query parameters:`, { tableName, question, section, columnName, school });
    return { S: -1, A: -1, N: -1 }; // Indicate error condition
  }
}

app.get('/api/frequency-ratings', async (req, res) => {
  try {
    const school = req.query.school as string | undefined;
    console.log(`Fetching frequency ratings${school ? ` for school: ${school}` : ' for all schools'}`);
    
    const results: FrequencyData[] = [];

    for (const [sectionKey, section] of Object.entries(sections)) {
      const sectionData: FrequencyData = {
        title: section.title,
        questions: []
      };

      for (const item of section.items) {
        const gridItem: GridItem = {
          displayText: item.displayText,
          questionMappings: item.questionMappings,
          results: {
            docentes: await calculateFrequencies('docentes_form_submissions', item.questionMappings.docentes, sectionKey, school),
            estudiantes: await calculateFrequencies('estudiantes_form_submissions', item.questionMappings.estudiantes, sectionKey, school),
            acudientes: await calculateFrequencies('acudientes_form_submissions', item.questionMappings.acudientes, sectionKey, school)
          }
        };
        sectionData.questions.push(gridItem);
      }

      results.push(sectionData);
    }

    console.log('Sending response with data:', results);
    res.json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add new types for monitoring
interface SchoolMonitoringData {
  schoolName: string;
  rectorName: string;
  currentPosition: string;
  personalEmail: string;
  institutionalEmail: string;
  personalPhone: string;
  institutionalPhone: string;
  preferredContact: string;
  submissions: {
    docentes: number;
    estudiantes: number;
    acudientes: number;
  };
  meetingRequirements: boolean;
}

// Add new endpoint for monitoring data
app.get('/api/monitoring', async (req, res) => {
  try {
    // Get all unique schools and rector contact information from rectores table
    const schoolsQuery = `
      SELECT DISTINCT 
        "nombre_de_la_institucion_educativa_en_la_actualmente_desempena_" as school_name,
        nombre_s_y_apellido_s_completo_s as rector_name,
        cargo_actual as current_position,
        correo_electronico_personal as personal_email,
        correo_electronico_institucional_el_que_usted_usa_en_su_rol_com as institutional_email,
        numero_de_celular_personal as personal_phone,
        telefono_de_contacto_de_la_ie as institutional_phone,
        prefiere_recibir_comunicaciones_en_el_correo as preferred_contact
      FROM rectores
    `;
    console.log('Executing schools query:', schoolsQuery);
    const schoolsResult = await pool.query(schoolsQuery);
    
    console.log('\n=== Raw Database Results ===');
    schoolsResult.rows.forEach((row, index) => {
      console.log(`\nSchool ${index + 1}:`, {
        school_name: row.school_name,
        cargo_actual: row.cargo_actual,
        current_position: row.current_position
      });
    });

    const monitoringData: SchoolMonitoringData[] = await Promise.all(
      schoolsResult.rows.map(async (school) => {
        console.log('\n=== Processing School ===');
        console.log('Raw school data:', {
          school_name: school.school_name,
          cargo_actual: school.cargo_actual,
          current_position: school.current_position
        });

        const docentesQuery = `
          SELECT COUNT(*) as count 
          FROM docentes_form_submissions 
          WHERE institucion_educativa = $1
        `;
        
        const counts = await Promise.all([
          pool.query(docentesQuery, [school.school_name]),
          pool.query(`
            SELECT COUNT(*) as count 
            FROM estudiantes_form_submissions 
            WHERE institucion_educativa = $1
          `, [school.school_name]),
          pool.query(`
            SELECT COUNT(*) as count 
            FROM acudientes_form_submissions 
            WHERE institucion_educativa = $1
          `, [school.school_name])
        ]);

        const submissions = {
          docentes: parseInt(counts[0].rows[0].count),
          estudiantes: parseInt(counts[1].rows[0].count),
          acudientes: parseInt(counts[2].rows[0].count)
        };

        const mappedData = {
          schoolName: school.school_name,
          rectorName: school.rector_name,
          currentPosition: school.cargo_actual || 'Rector',
          personalEmail: school.personal_email,
          institutionalEmail: school.institutional_email,
          personalPhone: school.personal_phone,
          institutionalPhone: school.institutional_phone,
          preferredContact: school.preferred_contact,
          submissions,
          meetingRequirements: 
            submissions.docentes >= 25 && 
            submissions.estudiantes >= 25 && 
            submissions.acudientes >= 25
        };

        console.log('Mapped data:', mappedData);
        return mappedData;
      })
    );

    res.json(monitoringData);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        // @ts-ignore
        position: error.position,
        // @ts-ignore
        detail: error.detail,
        // @ts-ignore
        hint: error.hint
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add interfaces for chart data
interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

// Extend PDFKit types
interface CustomPDFKit extends PDFKit.PDFDocument {
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
}

app.get('/api/generate-pdf', async (req, res) => {
  try {
    const school = req.query.school as string | undefined;
    const doc = new PDFKit() as CustomPDFKit;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=frequency-report${school ? `-${school}` : ''}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Function to add header to each page (for all pages except the first)
    const addHeader = () => {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Draw background rectangle for header
      doc.save()  // Save graphics state
         .fillColor('#F5F5F5')  // Light gray background
         .rect(0, 0, doc.page.width, 60)  // Rectangle from top of page
         .fill()
         .restore();  // Restore graphics state

      // Add header text
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#800000')  // Dark red color
         .text('Programa RLT y CLT', 40, 20)
         .text('Informe Encuesta de Ambiente Escolar', pageWidth - 240, 20, {
           width: 200,
           align: 'right'
         })
         .fillColor('#000000');  // Reset to black for remaining content
      
      doc.moveDown(2); // Reduced from 4 to 2 to decrease space after header

      // Keep footer margin setup without page numbers
      doc.page.margins.bottom = 30;  // Ensure space for footer
    };

    // Function to create cover page (first page)
    const createCoverPage = async () => {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      
      // Add logos at top
      const logoHeight = 100;   // Height for logos
      const logoWidth = 180;    // Width for logos
      const logoY = 50;         // Y position for logos
      const sideMargin = 40;    // Margin for both sides
      
      try {
        // Add RLT logo on the far left
        doc.image(
          path.join(__dirname, '..', '..', 'public', 'images', 'RLT_logo.jpeg'),
          sideMargin,  // X position at left margin
          logoY,
          {
            fit: [logoWidth, logoHeight]  // Width and height constraints
          }
        );

        // Add CLT logo on the far right
        doc.image(
          path.join(__dirname, '..', '..', 'public', 'images', 'CLT_logo.jpeg'),
          pageWidth - logoWidth + sideMargin/2,  // Extend into the margin area
          logoY,
          {
            fit: [logoWidth, logoHeight]  // Width and height constraints
          }
        );
      } catch (error) {
        console.error('Error loading logos:', error);
        // Continue without logos if they fail to load
      }

      doc.moveDown(8);  // Space after logos

      // Program titles in the middle
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('PROGRAMA', {
           align: 'center'
         })
         .moveDown(0.5);  // Reduced spacing

      doc.text('RECTORES LÍDERES TRANSFORMADORES', {
           align: 'center'
         })
         .moveDown(0.5);  // Reduced spacing

      doc.text('COORDINADORES LÍDERES TRANSFORMADORES', {
           align: 'center'
         })
         .moveDown(8);  // Space before survey title

      // Survey title
      doc.fontSize(36)
         .font('Helvetica')
         .text('Encuesta de', {
           align: 'center'
         })
         .text('Ambiente Escolar', {
           align: 'center'
         })
         .moveDown(2);  // Space before results text

      // Results text at bottom
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('INFORME DE RESULTADOS', {
           align: 'center'
         })
         .moveDown(1);  // Space before school name

      // Add school name if provided
      if (school) {
        // Calculate text dimensions and position for background
        const schoolText = school.toUpperCase();
        const fontSize = 16;
        const textWidth = doc.widthOfString(schoolText);
        const padding = 20;  // Padding around text
        const rectWidth = textWidth + (padding * 2);
        const rectHeight = fontSize + (padding * 0.8);  // Slightly less vertical padding
        const rectX = (pageWidth - rectWidth) / 2;  // Center the rectangle
        const currentY = doc.y;

        // Draw background rectangle for school name
        doc.save()  // Save graphics state
           .fillColor('#2C5282')  // Dark blue background
           .rect(rectX, currentY - padding/2, rectWidth, rectHeight)
           .fill()
           .restore();  // Restore graphics state

        // Add school name text
        doc.fontSize(fontSize)
           .font('Helvetica')
           .fillColor('white')  // White text
           .text(schoolText, {
             align: 'center'
           })
           .fillColor('black')  // Reset to black for subsequent text
           .moveDown(1);

        // Add ENTIDAD TERRITORIAL below school name
        const entidadText = await getEntidadTerritorial(school);
        const labelWidth = doc.widthOfString('ENTIDAD TERRITORIAL: ');
        const totalWidth = doc.widthOfString(`ENTIDAD TERRITORIAL: ${entidadText}`);
        const startX = (pageWidth - totalWidth) / 2;
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('ENTIDAD TERRITORIAL:     ', startX, doc.y, { continued: true })
           .font('Helvetica')
           .text(entidadText);
      }
    };

    // Create cover page (first page)
    await createCoverPage();
    
    // Add page break and header for page 2
    doc.addPage();
    addHeader();

    // Add explanatory text on page 2 with tighter margins
    const startX = 75;  // Further reduced margin
    const textWidth = doc.page.width - (startX * 2);  // Wider text width
    const startY = doc.y + 15;  // Minimal space after header

    // Reset cursor position
    doc.x = startX;
    doc.y = startY;

    // Title with reduced spacing
    doc.fontSize(14)  // Smaller title
       .font('Helvetica-Bold')
       .text('ENCUESTA DE AMBIENTE ESCOLAR', {
         align: 'center'
       })
       .moveDown(2);  // Reduced space after title

    // Main text with tighter formatting
    doc.fontSize(10)  // Slightly smaller font for better fit
       .font('Helvetica')
       .text('La Encuesta de Ambiente escolar tiene el objetivo de dar a conocer al directivo docente la percepción que los actores de la comunidad tienen sobre el ambiente escolar en la Institución Educativa para que pueda identificar los ejes de acción para emprender las transformaciones en la IE. La encuesta recoge la percepción de un grupo de estudiantes, docentes y acudientes para tener información de primera mano sobre los aspectos que tienen relación con el ambiente escolar.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5  // Tighter line spacing
       })
       .moveDown(0.5);

    doc.text('Para el Programa RLT y CLT el concepto de ambiente escolar se refiere a las dinámicas e interrelaciones que derivan de los procesos comunicativos, pedagógicos y convivenciales en la institución educativa. El ambiente escolar se reconoce como una de las variables que tiene mayor influencia en los aprendizajes en la escuela. En este sentido, es importante identificar los aspectos que desafían el liderazgo del directivo docente que participa en el Programa RLT y CLT.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(0.5);

    // Add content about comunicación with consistent tight spacing
    doc.text('La Encuesta de ambiente escolar indaga por tres componentes: comunicación; prácticas pedagógicas; y convivencia. La ', {
         continued: true,
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .font('Helvetica-Bold')
       .text('comunicación', { continued: true })
       .text(' ', { continued: true })
       .font('Helvetica')
       .text('se entiende como la capacidad de expresar las necesidades, intereses, posiciones, derechos e ideas propias de maneras claras y enfáticas (Programa Rectores Líderes Transformadores, 2017a) (1). La comunicación institucional fluida, con reglas claras y explícitas, facilita la interacción efectiva entre los docentes, los directivos, los estudiantes, las familias y otros miembros de la comunidad educativa. También facilita el trabajo en equipo, la resolución de problemas y conflictos, la construcción de metas comunes y el compromiso por los resultados. Implica construir relaciones basadas en el respeto por uno mismo y por los demás, usar un lenguaje que tenga un impacto más positivo en el otro, sin agredir. En relación con el ambiente escolar, la comunicación permite crear canales y mecanismos para promover la participación y la corresponsabilidad de los diferentes actores con los procesos de aprendizaje, lo que genera confianza y compromiso. Así mismo, permite reconocer y dar a conocer las innovaciones de las y los docentes para mejorar los aprendizajes, lo que genera redes de aprendizaje, impacta el clima laboral y la relación de estudiantes y familias con los docentes.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(0.5);

    // Add content about prácticas pedagógicas
    doc.text('Las ', {
         continued: true,
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .font('Helvetica-Bold')
       .text('prácticas pedagógicas', { continued: true })
       .text(' ', { continued: true })
       .font('Helvetica')
       .text('son el conjunto de acciones que las y los docentes emprender para que las y los estudiantes desarrollen sus competencias y mejores sus aprendizajes y no se limitan al aula de clase. ', {
         continued: true,
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .font('Helvetica-Oblique')
       .text('En relación con el ambiente escolar', {
         continued: true
       })
       .font('Helvetica')
       .text(', las prácticas pedagógicas impactan las emociones y creencias sobre la didáctica, la evaluación y la pertinencia de los procesos formativos que se dan en la institución educativa. El uso de espacios diferentes al aula de clase, la construcción de proyectos interdisciplinarios y la apertura a espacios de interacción con otras instituciones, facilitan y enriquecen los saberes de docentes y estudiantes pues los invita a comprender que tienen un lugar orgánico dentro de la comunidad desde su rol en la Institución Educativa, lo cual crea sentido de pertenencia y evidencia el poder transformador de la pedagogía. De la misma manera, tener altas expectativas de las niñas, niños y jóvenes, tener en cuenta sus necesidades e intereses para la construcción de los planes de aula, y tener en cuenta su dimensión afectiva y emocional cuando son evaluados, impacta las relaciones entre docentes, familias y estudiantes, lo cual deriva en relaciones más respetuosas y solidarias en la institución.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(12);  // Increased from 2 to 8 to add more space before the reference

    // Add first reference at the end of page 2
    doc.fontSize(7.5)  // Even smaller font for references
       .font('Helvetica-Oblique')
       .text('(1) Programa Rectores Líderes Transformadores (2017a). Cartilla del módulo 1: Gestión personal. Bogotá: Fundación Empresarios por la Educación.', {
         align: 'left',
         width: textWidth,
         indent: 0,
         lineGap: 0.25
       });

    // Add page 3 with convivencia content
    doc.addPage();
    addHeader();

    // Reset cursor position for page 3
    doc.x = startX;
    doc.y = startY;

    // Start convivencia section with consistent formatting
    doc.fontSize(10)
       .font('Helvetica')
       .text('La ', {
         continued: true,
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .font('Helvetica-Bold')
       .text('convivencia ', {
         continued: true
       })
       .font('Helvetica')
       .text(' se entiende con el conjunto de relaciones que se construyen por el afecto, las emociones, los deseos y los sueños de quienes componen una comunidad. En ellas se promueven y vivencian los derechos humanos, la igualdad en el trato, el reconocimiento y el respeto por las diferencias para la construcción del tejido social. La convivencia escolar es un aprendizaje permanente que orienta a los sujetos a "aprender a vivir juntos" y pasa por el deber que tiene la institución educativa de garantizar el respeto a los derechos humanos. Comprendiendo la condición humana diversa, este aprendizaje pasa por asumir la diferencia como posibilidad de aprendizaje entre pares y el conflicto como una constante en las relaciones humanas que están en la base de la construcción de ciudadanía. La autonomía y la ética del cuidado son elementos formativos fundamentales para la convivencia escolar (Rectores Líderes Transformadores, 2017b) (2). En relación con el ambiente escolar, el trato respetuoso y solidario con las otras y los otros, la construcción de acuerdos colectivos para convivir, la comprensión de la diferencia como potencia y no como déficit, el sentirse escuchado y comprendido y el tener herramientas disponibles para actuar frente a los conflictos impacta la manera como interactuamos a diario y la comprensión que tenemos sobre el mundo.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(0.5);

    // Add remaining paragraphs with consistent tight spacing
    doc.text('Conocer la percepción sobre el ambiente escolar le permite al directivo evidenciar los aspectos que su comunidad educativa resalta como fortalezas y como oportunidades de mejora desde su vivencia en el aula de clase y como producto de sus interacciones. Esta información de "primera mano" es muy valiosa para el directivo pues puede, de manera articulada con las actividades propuestas por el Programa, emprender acciones oportunas para superar dificultades que se presentan en la IE. Esta información debe ser compartida con la comunidad educativa y con ellos analizar estos resultados para poder identificar acciones o un plan de acción para superar los retos identificados. De esta manera, se asegura que quien participa en la encuesta pueda conocer los resultados y emprender procesos de corresponsabilidad.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(0.5);

    doc.text('Estos resultados son una herramienta para identificar retos y oportunidades de mejora en el ambiente escolar de la institución educativa que lidera y no constituyen una medición directa sobre el ambiente escolar. Es decir, los resultados presentados muestran la percepción de un grupo no representativo de actores indicando los aspectos que este grupo resalta en relación a las prácticas pedagógicas, la convivencia y la comunicación.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(0.5);

    doc.text('El informe se divide en tres partes. En la primera se encuentra la información general del directivo y de las personas encuestadas. La segunda es un resumen general de la percepción del ambiente que tiene cada uno de los grupos de actores en los tres componentes evaluados (comunicación, prácticas pedagógicas y convivencia). Al final está un resumen de las respuestas de cada uno de los ítems de la encuesta y un espacio para que el directivo escriba los retos que este informe le plantea.', {
         align: 'justify',
         width: textWidth,
         indent: 0,
         lineGap: 0.5
       })
       .moveDown(20);

    // Add references with minimal spacing
    doc.fontSize(7.5)  // Even smaller font for references
       .font('Helvetica-Oblique')
       .text('(2) Programa Rectores Líderes Transformadores (2017b). Cartilla del módulo 2: Gestión pedagógica. Bogotá: Fundación Empresarios por la Educación.', {
         align: 'left',
         width: textWidth,
         indent: 0,
         lineGap: 0.25
       });

    // Add remaining blank pages (pages 4-6)
    for (let i = 0; i < 3; i++) {
      doc.addPage();
      addHeader();

      // Add IDENTIFICACION section on page 4
      if (i === 0) {
        const startX = 75;
        const textWidth = doc.page.width - (startX * 2);
        const startY = doc.y + 15;
        const labelWidth = 200;  // Width for right-aligned labels
        const valueX = startX + labelWidth + 10;  // Fixed starting position for values

        // Reset cursor position
        doc.x = startX;
        doc.y = startY;

        



        // Query and add entidad_territorial with right-aligned label
        if (school) {
          const territorialY = doc.y;


          // Add ENCUESTADOS title at same x position as IDENTIFICACION
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
          const gradesData = await getGradesDistribution(school || '');
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
          const scheduleData = await getScheduleDistribution(school || '');
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
              const textWidth = doc.widthOfString(`${percentage}%`);  // Get width of text
              const textX = currentX + (barWidth - textWidth)/2;  // Center text in segment
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
          const textWidth = contentWidth - iconWidth;

          // Draw border around text (solid line)
          doc.lineWidth(0.5)
             .rect(textStartX, noteY, textWidth, 30)
             .stroke();

          // Add note text
          doc.fontSize(10)
             .font('Helvetica-Bold')  // Made bold
             .fillColor('#FF0000')  // Red color
             .text('Analice la composición de los distintos grupos encuestados y tenga encuenta que esta muestra no representa la totalidad de su IE.',
               textStartX + notePadding, noteY + 8, {
                 width: textWidth - (notePadding * 2),
                 align: 'center'
               });

          // Add new page for RESUMEN GENERAL
          doc.addPage();
          addHeader();  // Add the standard header

          // Add RESUMEN GENERAL title
          doc.fontSize(18)
             .font('Helvetica-Bold')
             .fillColor('black')  // Reset color to black
             .text('RESUMEN GENERAL', 40, doc.y + 20, {
               align: 'left',
               underline: false
             });

          // Add DOCENTES section
          doc.moveDown(2);
          const sectionStartX = 40;
          const sectionWidth = doc.page.width - (sectionStartX * 2);
          const sectionTitleHeight = 20;
          
          // Get current Y position
          const summaryDocentesY = doc.y;
          
          // Draw background rectangle for DOCENTES
          doc.save()
             .fillColor('#1E3A8A')  // Dark blue background
             .rect(sectionStartX, summaryDocentesY, sectionWidth, sectionTitleHeight)
             .fill()
             .restore();

          // Add DOCENTES title
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor('white')  // White text for contrast
             .text('DOCENTES', sectionStartX, summaryDocentesY + 4, {
               width: sectionWidth,
               align: 'center'
             });

          // Get frequency data first
          console.log('\nGetting frequency data...');
          const frequencyData = await getFrequencyData(school);
          console.log('Available categories:', frequencyData.map(d => d.title));

          // Constants for stacked bar layout
          const stackedBarLabelWidth = 150;  // Width for category labels
          const stackedBarWidth = sectionWidth - stackedBarLabelWidth;  // Remaining width for bars

          // Calculate averages for each category
          const calculateCategoryAverages = (data: FrequencyData[], category: string, role: 'docentes' | 'estudiantes' | 'acudientes' = 'docentes') => {
            console.log(`\nCalculating averages for category: ${category}, role: ${role}`);
            const categoryData = data.find(d => d.title === category);
            console.log('Found category data:', categoryData ? categoryData.title : 'not found');
            if (!categoryData) return { S: 0, A: 0, N: 0 };
            
            let totalS = 0, totalA = 0, totalN = 0;
            let validCount = 0;
            
            categoryData.questions.forEach((q, index) => {
              console.log(`\nQuestion ${index + 1}:`, q.displayText);
              console.log('Results:', q.results[role]);
              const results = q.results[role];
              if (results.S !== -1) {
                totalS += results.S;
                totalA += results.A;
                totalN += results.N;
                validCount++;
              }
            });
            
            console.log('\nTotals:', { totalS, totalA, totalN, validCount });
            const averages = {
              S: validCount ? Math.round(totalS / validCount) : 0,
              A: validCount ? Math.round(totalA / validCount) : 0,
              N: validCount ? Math.round(totalN / validCount) : 0
            };
            console.log('Averages:', averages);
            return averages;
          };

          // Get averages for DOCENTES
          const docentesAvgComunicacion = calculateCategoryAverages(frequencyData, 'COMUNICACIÓN', 'docentes');
          const docentesAvgPracticas = calculateCategoryAverages(frequencyData, 'PRÁCTICAS PEDAGÓGICAS', 'docentes');
          const docentesAvgConvivencia = calculateCategoryAverages(frequencyData, 'CONVIVENCIA', 'docentes');

          // Draw stacked bars
          const barStartY = doc.y + 20;  // Add some space after the title
          const barHeight = 20;

          // Helper function to draw a stacked bar
          const drawStackedBar = (label: string, values: { S: number, A: number, N: number }, y: number) => {
            // Draw label
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('black')
               .text(label, sectionStartX, y + 4, {
                 width: stackedBarLabelWidth,
                 align: 'left'
               });

            // Check if we have any values
            if (values.S === 0 && values.A === 0 && values.N === 0) {
              // Draw "Sin información" text
              doc.fontSize(10)
                 .fillColor('#666666')
                 .text('Sin información', sectionStartX + stackedBarLabelWidth + 10, y + 4);
              return;
            }

            // Normalize values to ensure they sum to 100%
            const actualTotal = values.S + values.A + values.N;
            const normalizedValues = {
              S: Math.round((values.S / actualTotal) * 100),
              A: Math.round((values.A / actualTotal) * 100),
              N: Math.round((values.N / actualTotal) * 100)
            };

            // Adjust for rounding errors to ensure sum is exactly 100
            const sum = normalizedValues.S + normalizedValues.A + normalizedValues.N;
            if (sum > 100) {
              // Remove excess from the largest value
              const max = Math.max(normalizedValues.S, normalizedValues.A, normalizedValues.N);
              if (max === normalizedValues.S) normalizedValues.S -= (sum - 100);
              else if (max === normalizedValues.A) normalizedValues.A -= (sum - 100);
              else normalizedValues.N -= (sum - 100);
            } else if (sum < 100) {
              // Add remainder to the largest value
              const max = Math.max(normalizedValues.S, normalizedValues.A, normalizedValues.N);
              if (max === normalizedValues.S) normalizedValues.S += (100 - sum);
              else if (max === normalizedValues.A) normalizedValues.A += (100 - sum);
              else normalizedValues.N += (100 - sum);
            }

            let currentX = sectionStartX + stackedBarLabelWidth;
            
            // Draw S segment (Blue)
            const sWidth = (normalizedValues.S / 100) * stackedBarWidth;
            doc.rect(currentX, y, sWidth, barHeight)
               .fillColor('#4472C4')
               .fill();
            if (values.S > 0) {
              doc.fillColor('white')
                 .fontSize(8)
                 .text(`${values.S}%`,
                   currentX + (sWidth/2) - 8,
                   y + (barHeight/2),
                   { baseline: 'middle' });
            }
            currentX += sWidth;

            // Draw A segment (Yellow)
            const aWidth = (normalizedValues.A / 100) * stackedBarWidth;
            doc.rect(currentX, y, aWidth, barHeight)
               .fillColor('#FFC000')
               .fill();
            if (values.A > 0) {
              doc.fillColor('black')
                 .fontSize(8)
                 .text(`${values.A}%`,
                   currentX + (aWidth/2) - 8,
                   y + (barHeight/2),
                   { baseline: 'middle' });
            }
            currentX += aWidth;

            // Draw N segment (Red)
            const nWidth = (normalizedValues.N / 100) * stackedBarWidth;
            doc.rect(currentX, y, nWidth, barHeight)
               .fillColor('#FF0000')
               .fill();
            if (values.N > 0) {
              doc.fillColor('white')
                 .fontSize(8)
                 .text(`${values.N}%`,
                   currentX + (nWidth/2) - 8,
                   y + (barHeight/2),
                   { baseline: 'middle' });
            }
          };

          // Draw bars for each category
          drawStackedBar('Comunicación', docentesAvgComunicacion, barStartY);
          drawStackedBar('Prácticas pedagógicas', docentesAvgPracticas, barStartY + barHeight + 10);
          drawStackedBar('Convivencia', docentesAvgConvivencia, barStartY + (barHeight + 10) * 2);

          // Add legend
          const stackedBarLegendY = barStartY + (barHeight + 10) * 3 + 10;
          const stackedBarLegendSpacing = 80;
          
          // S legend
          doc.rect(sectionStartX, stackedBarLegendY, 12, 12)
             .fillColor('#4472C4')
             .fill();
          doc.fillColor('black')
             .fontSize(8)
             .text('Siempre/Casi siempre', sectionStartX + 16, stackedBarLegendY + 2);

          // A legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 1.5, stackedBarLegendY, 12, 12)
             .fillColor('#FFC000')
             .fill();
          doc.fillColor('black')
             .text('A veces', sectionStartX + stackedBarLegendSpacing * 1.5 + 16, stackedBarLegendY + 2);

          // N legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 3, stackedBarLegendY, 12, 12)
             .fillColor('#FF0000')
             .fill();
          doc.fillColor('black')
             .text('Casi nunca/Nunca', sectionStartX + stackedBarLegendSpacing * 3 + 16, stackedBarLegendY + 2);

          // Add ESTUDIANTES section
          doc.moveDown(2);
          doc.rect(sectionStartX, doc.y, sectionWidth, sectionTitleHeight)
             .fillColor('#1E3A8A')
             .fill();
          doc.fillColor('white')
             .fontSize(12)
             .text('ESTUDIANTES', sectionStartX, doc.y + 4, {
               width: sectionWidth,
               align: 'center'
             });

          // Calculate averages for ESTUDIANTES
          console.log('\nCalculating ESTUDIANTES averages...');
          const estudiantesAvgComunicacion = calculateCategoryAverages(frequencyData, 'COMUNICACIÓN', 'estudiantes');
          const estudiantesAvgPracticas = calculateCategoryAverages(frequencyData, 'PRÁCTICAS PEDAGÓGICAS', 'estudiantes');
          const estudiantesAvgConvivencia = calculateCategoryAverages(frequencyData, 'CONVIVENCIA', 'estudiantes');

          // Draw stacked bars for ESTUDIANTES
          const estudiantesBarStartY = doc.y + 20;
          drawStackedBar('Comunicación', estudiantesAvgComunicacion, estudiantesBarStartY);
          drawStackedBar('Prácticas pedagógicas', estudiantesAvgPracticas, estudiantesBarStartY + barHeight + 10);
          drawStackedBar('Convivencia', estudiantesAvgConvivencia, estudiantesBarStartY + (barHeight + 10) * 2);

          // Add legend for ESTUDIANTES
          const estudiantesLegendY = estudiantesBarStartY + (barHeight + 10) * 3 + 10;
          
          // S legend
          doc.rect(sectionStartX, estudiantesLegendY, 12, 12)
             .fillColor('#4472C4')
             .fill();
          doc.fillColor('black')
             .fontSize(8)
             .text('Siempre/Casi siempre', sectionStartX + 16, estudiantesLegendY + 2);

          // A legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 1.5, estudiantesLegendY, 12, 12)
             .fillColor('#FFC000')
             .fill();
          doc.fillColor('black')
             .text('A veces', sectionStartX + stackedBarLegendSpacing * 1.5 + 16, estudiantesLegendY + 2);

          // N legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 3, estudiantesLegendY, 12, 12)
             .fillColor('#FF0000')
             .fill();
          doc.fillColor('black')
             .text('Casi nunca/Nunca', sectionStartX + stackedBarLegendSpacing * 3 + 16, estudiantesLegendY + 2);

          // Add ACUDIENTES section
          doc.moveDown(2);
          doc.rect(sectionStartX, doc.y, sectionWidth, sectionTitleHeight)
             .fillColor('#1E3A8A')
             .fill();
          doc.fillColor('white')
             .fontSize(12)
             .text('ACUDIENTES', sectionStartX, doc.y + 4, {
               width: sectionWidth,
               align: 'center'
             });

          // Calculate averages for ACUDIENTES
          const acudientesAvgComunicacion = calculateCategoryAverages(frequencyData, 'COMUNICACIÓN', 'acudientes');
          const acudientesAvgPracticas = calculateCategoryAverages(frequencyData, 'PRÁCTICAS PEDAGÓGICAS', 'acudientes');
          const acudientesAvgConvivencia = calculateCategoryAverages(frequencyData, 'CONVIVENCIA', 'acudientes');

          // Draw stacked bars for ACUDIENTES
          const acudientesBarStartY = doc.y + 20;
          drawStackedBar('Comunicación', acudientesAvgComunicacion, acudientesBarStartY);
          drawStackedBar('Prácticas pedagógicas', acudientesAvgPracticas, acudientesBarStartY + barHeight + 10);
          drawStackedBar('Convivencia', acudientesAvgConvivencia, acudientesBarStartY + (barHeight + 10) * 2);

          // Add legend for ACUDIENTES
          const acudientesLegendY = acudientesBarStartY + (barHeight + 10) * 3 + 10;
          
          // S legend
          doc.rect(sectionStartX, acudientesLegendY, 12, 12)
             .fillColor('#4472C4')
             .fill();
          doc.fillColor('black')
             .fontSize(8)
             .text('Siempre/Casi siempre', sectionStartX + 16, acudientesLegendY + 2);

          // A legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 1.5, acudientesLegendY, 12, 12)
             .fillColor('#FFC000')
             .fill();
          doc.fillColor('black')
             .text('A veces', sectionStartX + stackedBarLegendSpacing * 1.5 + 16, acudientesLegendY + 2);

          // N legend
          doc.rect(sectionStartX + stackedBarLegendSpacing * 3, acudientesLegendY, 12, 12)
             .fillColor('#FF0000')
             .fill();
          doc.fillColor('black')
             .text('Casi nunca/Nunca', sectionStartX + stackedBarLegendSpacing * 3 + 16, acudientesLegendY + 2);

          // Continue with the rest of the document
          // ... existing code ...
        }
      }
    }
    
    // Add header to page 7 (where content starts)
    doc.addPage();
    addHeader();
    
    // Get frequency data
    const frequencyData = await getFrequencyData(school);
    
    // Add sections
    for (const section of frequencyData) {
      // Define table dimensions and positions
      const startX = 40;
      let currentY = section.title === 'COMUNICACIÓN' ? 65 : doc.y;  // Initial Y position
      const numberWidth = 30;  // Width for the new leftmost column
      const questionWidth = 240;  // Doubled from 120 to 240
      const ratingWidth = 25;
      const groupWidth = ratingWidth * 3;
      const rowHeight = 30;

      // Only force new page for CONVIVENCIA section
      if (section.title === 'CONVIVENCIA') {
        doc.addPage();
        addHeader();
        currentY = doc.y;
      } else {
        // For other sections, only add page break if not enough space
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
          addHeader();
          currentY = doc.y;
        }
      }
      
      // Add main title and legend at the top of first page
      if (section.title === 'COMUNICACIÓN') {
        // Add main title
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('FORTALEZAS Y RETOS', startX, 65, {  // Reduced from 100 to 65
             align: 'left',
             underline: false
           });
        
        doc.moveDown(0.5);  // Reduced from 1 to 0.5 to decrease space after title
        currentY = doc.y;

        // Calculate content width based on table width
        const contentWidth = numberWidth + questionWidth + (groupWidth * 3);  // This matches the table width
        
        // Draw exclamation mark
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('!', startX + 12, currentY + 2);
        
        // Add color legend with solid border
        const legendPadding = 10;
        const iconWidth = 30;  // Space for the exclamation mark
        const textStartX = startX + iconWidth;
        const textWidth = contentWidth - iconWidth;
        
        // Draw border around text (solid line)
        doc.lineWidth(0.5)
           .rect(textStartX, currentY, textWidth, 30)
           .stroke();

        // Add legend text
        doc.fontSize(10)
           .font('Helvetica')
           .text('Los elementos en naranja representan elementos a mejorar.',
             textStartX + legendPadding, currentY + 8, {
               width: textWidth - (legendPadding * 2),
               align: 'center'
             });
        
        doc.moveDown(3);  // Increased space after legend box
        currentY = doc.y;
        
        // Add S, A, N legend
        doc.fontSize(10)
           .font('Helvetica')
           .text('S = Siempre / Casi Siempre', startX, currentY)
           .text('A = A veces', startX, currentY + 15)
           .text('N = Nunca / Casi nunca', startX, currentY + 30);
        
        doc.moveDown(1);  // One line of space after legend
        currentY = doc.y;
      }
      
      // If it's the CONVIVENCIA section on a new page, add the legend
      if (section.title === 'CONVIVENCIA') {
        // Add more space after header before legend
        doc.moveDown(4);  // Increased spacing
        currentY = doc.y;
        
        // Add legend at the top of new page
        doc.fontSize(10)
           .font('Helvetica')
           .text('S = Siempre / Casi Siempre', startX, currentY)
           .text('A = A veces', startX, currentY + 15)
           .text('N = Nunca / Casi nunca', startX, currentY + 30);
        
        doc.moveDown(1);  // One line of space after legend
        currentY = doc.y;
      }
      
      // Draw table outline
      doc.lineWidth(0.5);
      doc.font('Helvetica');
      
      // Define constants
      const groups = ['Docentes', 'Estudiantes', 'Acudientes'];
      const ratings = ['S', 'A', 'N'] as const;
      
      // Calculate merged cell height based on section
      const mergedCellHeight = rowHeight * (
        section.title === 'COMUNICACIÓN' ? section.questions.length :  // Just questions height for COMUNICACIÓN
        section.title === 'PRÁCTICAS PEDAGÓGICAS' ? section.questions.length :  // Just data rows
        section.questions.length  // Changed to match exactly the number of questions
      );
      
      // Calculate starting Y position for the title column
      const titleStartY = 
        section.title === 'COMUNICACIÓN' ? currentY + rowHeight + rowHeight/2 :  // Start after both header rows
        section.title === 'PRÁCTICAS PEDAGÓGICAS' ? currentY + rowHeight :
        currentY + rowHeight + rowHeight/2;  // For CONVIVENCIA, start after headers like COMUNICACIÓN
      
      // Set color based on section
      let sectionColor;
      switch(section.title) {
        case 'COMUNICACIÓN':
          sectionColor = '#2C5282';  // Deep blue
          break;
        case 'PRÁCTICAS PEDAGÓGICAS':
          sectionColor = '#2F6B25';  // Forest green
          break;
        case 'CONVIVENCIA':
          sectionColor = '#923131';  // Deep red
          break;
      }
      
      // Draw merged cell for number column with vertical section title and background color
      doc.rect(startX, titleStartY, numberWidth, mergedCellHeight)
         .fill(sectionColor);
      
      // Save the current graphics state
      doc.save();
      
      // Calculate the center point for rotation
      const centerX = startX + (numberWidth / 2);
      const centerY = titleStartY + (mergedCellHeight / 2);
      
      // Move to center point, rotate, and draw white text
      doc.translate(centerX, centerY)
         .rotate(-90) // Rotate 90 degrees counterclockwise
         .fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('white')  // White text for contrast
         .text(section.title, -(mergedCellHeight / 2), -5, {
           width: mergedCellHeight,
           align: 'center'
         });
      
      // Restore the graphics state and colors
      doc.restore();
      doc.fillColor('black');  // Reset to black for remaining text
      
      // Reset font to normal
      doc.font('Helvetica');
      
      // Draw headers only for COMUNICACIÓN and CONVIVENCIA sections
      if (section.title !== 'PRÁCTICAS PEDAGÓGICAS') {
        // Draw group headers (leaving the question column empty in first row)
        groups.forEach((group, i) => {
          const x = startX + numberWidth + questionWidth + (i * groupWidth);
          
          // Draw thicker vertical separator line before each group and at the edges
          if (i > 0) {
            doc.lineWidth(2)  // Thicker line for separation
               .moveTo(x, currentY)
               .lineTo(x, currentY + rowHeight * (section.questions.length + 1.5))
               .stroke();
            doc.lineWidth(0.5);  // Reset line width
          }
          
          // Draw left edge for Docentes
          if (i === 0) {
            doc.lineWidth(2)
               .moveTo(x, currentY)
               .lineTo(x, currentY + rowHeight * (section.questions.length + 1.5))
               .stroke();
            doc.lineWidth(0.5);
          }
          
          // Draw right edge for Acudientes
          if (i === groups.length - 1) {
            const rightX = x + groupWidth;
            doc.lineWidth(2)
               .moveTo(rightX, currentY)
               .lineTo(rightX, currentY + rowHeight * (section.questions.length + 1.5))
               .stroke();
            doc.lineWidth(0.5);
          }
          
          doc.rect(x, currentY, groupWidth, rowHeight).stroke();
          doc.font('Helvetica-Bold')  // Make group titles bold
             .text(group, x + 3, currentY + 8, {
            width: groupWidth - 6,
            align: 'center'
          });
          doc.font('Helvetica');  // Reset font
        });
        
        // Move to rating headers row
        currentY += rowHeight;
        
        // Draw "Item de la encuesta" header in the second row
        doc.rect(startX + numberWidth, currentY, questionWidth, rowHeight/2).stroke();
        doc.font('Helvetica-Bold')
           .text('Item de la encuesta', startX + numberWidth + 3, currentY + 4, {
           width: questionWidth - 6,
           align: 'center'
        });
        
        // Reset font
        doc.font('Helvetica');
        
        // Draw rating headers (S, A, N)
        groups.forEach((_, groupIndex) => {
          // Draw thicker vertical separator line before each group (except first)
          if (groupIndex > 0) {
            const separatorX = startX + numberWidth + questionWidth + (groupIndex * groupWidth);
            doc.lineWidth(2);  // Thicker line for separation
            doc.moveTo(separatorX, currentY)
               .lineTo(separatorX, currentY + rowHeight/2)
               .stroke();
            doc.lineWidth(0.5);  // Reset line width
          }
          
          ratings.forEach((rating, ratingIndex) => {
            const x = startX + numberWidth + questionWidth + (groupIndex * groupWidth) + (ratingIndex * ratingWidth);
            doc.rect(x, currentY, ratingWidth, rowHeight/2).stroke();
            doc.text(rating, x + 3, currentY + 4, {
              width: ratingWidth - 6,
              align: 'center'
            });
          });
        });
        
        // Move to data rows
        currentY += rowHeight/2;
      } else {
        // For PRÁCTICAS PEDAGÓGICAS, just move to data rows
        currentY += rowHeight;
      }
      
      // Draw data rows
      for (const question of section.questions) {
        // Check if we need a new page before drawing the row
        if (currentY > doc.page.height - rowHeight) {
          doc.addPage();
          addHeader();
          currentY = doc.y;
        }

        const rowStartY = currentY;
        
        // Draw question cell with left alignment
        doc.rect(startX + numberWidth, currentY, questionWidth, rowHeight).stroke();
        doc.fontSize(9)
           .text(question.displayText, startX + numberWidth + 3, currentY + 3, {
          width: questionWidth - 6,
          height: rowHeight - 6,
          align: 'left'
        });
        
        // Draw result cells for each group
        const groupKeys = ['docentes', 'estudiantes', 'acudientes'] as const;
        
        groupKeys.forEach((group, groupIndex) => {
          // Draw vertical separators for PRÁCTICAS PEDAGÓGICAS
          if (section.title === 'PRÁCTICAS PEDAGÓGICAS') {
            const x = startX + numberWidth + questionWidth + (groupIndex * groupWidth);
            
            // Draw vertical separators
            if (groupIndex > 0) {  // Between groups
              doc.lineWidth(2)
                 .moveTo(x, currentY)
                 .lineTo(x, currentY + rowHeight)
                 .stroke()
                 .lineWidth(0.5);
            }
            
            if (groupIndex === 0) {  // Left edge
              doc.lineWidth(2)
                 .moveTo(x, currentY)
                 .lineTo(x, currentY + rowHeight)
                 .stroke()
                 .lineWidth(0.5);
            }
            
            if (groupIndex === groupKeys.length - 1) {  // Right edge
              const rightX = x + groupWidth;
              doc.lineWidth(2)
                 .moveTo(rightX, currentY)
                 .lineTo(rightX, currentY + rowHeight)
                 .stroke()
                 .lineWidth(0.5);
            }
          }
          
          ratings.forEach((rating, ratingIndex) => {
            const x = startX + numberWidth + questionWidth + (groupIndex * groupWidth) + (ratingIndex * ratingWidth);
            const value = question.results[group][rating];
            
            // Draw cell border
            doc.rect(x, currentY, ratingWidth, rowHeight).stroke();
            
            // Handle different value cases
            if (value === -1) {
              doc.font('Helvetica-Oblique')
                 .fontSize(7)
                 .fillColor('#666666')
                 .text('Sin datos', x + 2, currentY + (rowHeight/2) - 6, {
                   width: ratingWidth - 4,
                   align: 'center'
                 });
              doc.font('Helvetica')
                 .fillColor('#000000');
            } else {
              if (rating === 'S' && value < 50 && value !== -1) {
                doc.rect(x, currentY, ratingWidth, rowHeight)
                   .fill('#FFA500');  // Orange color for values < 50%
                doc.fillColor('#000000');  // Black text for better contrast on orange
              }
              
              doc.fontSize(7)
                 .text(
                   `${value}%`,
                   x + 1,
                   currentY + (rowHeight/2) - 6,
                   { 
                     width: ratingWidth - 2,
                     align: 'center'
                   }
                 );
              
              doc.fillColor('#000000');
            }
          });
        });
        
        currentY += rowHeight;
      }
      
      // After the table is drawn, only handle page break for PRÁCTICAS PEDAGÓGICAS
      if (section !== frequencyData[frequencyData.length - 1]) {
        if (section.title === 'PRÁCTICAS PEDAGÓGICAS') {
          currentY = doc.y;
        }
      } else {
        // Add challenges section after the last table (CONVIVENCIA)
        if (doc.y > doc.page.height - 300) { // Check if we need a new page for challenges section
          doc.addPage();
          addHeader();
          // Start content further down from header on page 8
          currentY = 150; // Increased starting position
        } else {
          doc.moveDown(4);  // Add space after the last table
          currentY = doc.y;
        }

        // Add title
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('RETOS PARA EL DIRECTIVO EVALUADO', startX, currentY, {
             align: 'left',
             underline: false
           });

        doc.moveDown(1);
        currentY = doc.y;

        // Calculate content width based on table width
        const contentWidth = numberWidth + questionWidth + (groupWidth * 3);

        // Draw exclamation mark
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('!', startX + 12, currentY + 2);

        // Add instruction box with solid border
        const legendPadding = 10;
        const iconWidth = 30;
        const textStartX = startX + iconWidth;
        const textWidth = contentWidth - iconWidth;

        // Draw border around text (solid line)
        doc.lineWidth(0.5)
           .rect(textStartX, currentY, textWidth, 30)
           .stroke();

        // Add instruction text
        doc.fontSize(10)
           .font('Helvetica')
           .text('En el recuadro escriba los retos que estos resultados le plantean como líder.',
             textStartX + legendPadding, currentY + 8, {
               width: textWidth - (legendPadding * 2),
               align: 'center'
             });

        doc.moveDown(2);
        currentY = doc.y;

        // Add large text box for writing challenges
        const boxHeight = 200;  // Height for writing challenges
        doc.lineWidth(0.5)
           .rect(startX, currentY, contentWidth, boxHeight)
           .stroke();
      }
    }
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get frequency data
async function getFrequencyData(school?: string): Promise<FrequencyData[]> {
  const results: FrequencyData[] = [];

  for (const [sectionKey, section] of Object.entries(sections)) {
    const sectionData: FrequencyData = {
      title: section.title,
      questions: []
    };

    for (const item of section.items) {
      const gridItem: GridItem = {
        displayText: item.displayText,
        questionMappings: item.questionMappings,
        results: {
          docentes: await calculateFrequencies('docentes_form_submissions', item.questionMappings.docentes, sectionKey, school),
          estudiantes: await calculateFrequencies('estudiantes_form_submissions', item.questionMappings.estudiantes, sectionKey, school),
          acudientes: await calculateFrequencies('acudientes_form_submissions', item.questionMappings.acudientes, sectionKey, school)
        }
      };
      sectionData.questions.push(gridItem);
    }

    results.push(sectionData);
  }

  return results;
}

// Add new helper function to get entidad_territorial
async function getEntidadTerritorial(school: string): Promise<string> {
  try {
    const query = `
      SELECT entidad_territorial 
      FROM rectores 
      WHERE nombre_de_la_institucion_educativa_en_la_actualmente_desempena_ = $1 
      LIMIT 1
    `;
    const result = await pool.query(query, [school]);
    return result.rows[0]?.entidad_territorial || 'No especificada';
  } catch (error) {
    console.error('Error fetching entidad_territorial:', error);
    return 'No especificada';
  }
}

// Add new helper function to get docentes count
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

// Add helper function to get estudiantes count
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

// Add helper function for acudientes count (add this near the other helper functions)
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

// Function to draw a pie chart
function drawPieChart(
  doc: CustomPDFKit,
  data: PieChartData[],
  centerX: number,
  centerY: number,
  radius: number,
  title: string,
  isFirstChart: boolean = false,
  legendBelow: boolean = false,
  multiLineLegend: boolean = false
) {
  try {
    let currentAngle = 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Draw title
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('black')  // Set color to black
       .text(title, centerX - radius, centerY - radius - 25, {
         width: radius * 2,
         align: 'center'
       });

    // Draw pie segments with percentages
    data.forEach(item => {
      const segmentAngle = (item.value / total) * 2 * Math.PI;
      const percentage = Math.round((item.value / total) * 100);
      
      // Draw segment
      doc.save()
         .moveTo(centerX, centerY)
         .arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle)
         .lineTo(centerX, centerY)
         .fillColor(item.color)
         .fill();

      // Calculate position for percentage text
      const midAngle = currentAngle + (segmentAngle / 2);
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(midAngle) * textRadius;
      const textY = centerY + Math.sin(midAngle) * textRadius;

      // Draw percentage with white text
      if (percentage > 3) {
        doc.fillColor('white')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(`${percentage}%`, 
             textX - 12,
             textY - 5,
             {
               width: 24,
               align: 'center'
             });
      }
      
      doc.restore();
      currentAngle += segmentAngle;
    });

    // Add legend
    const legendBoxSize = 8;
    const legendTextPadding = 5;
    let legendX: number;
    let legendY: number;

    if (legendBelow) {
      // Place legend below the chart
      legendX = multiLineLegend ? 
        (centerX - radius - 30) :  // Original position for pie chart 3's legend
        (centerX - radius + 12);   // Reduced from +30 to +15 to move legend more left
      legendY = centerY + radius + 10;  // 10 points padding below chart
      
      if (multiLineLegend) {
        // Calculate items per row (3 rows for grades)
        const itemsPerRow = Math.ceil(data.length / 3);
        const rowSpacing = 15;  // Space between rows
        
        data.forEach((item, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const currentX = legendX + (col * 60);  // Keep 60 points spacing between items
          const currentY = legendY + (row * rowSpacing);  // 15 points between rows

          // Color box
          doc.rect(currentX, currentY, legendBoxSize, legendBoxSize)
             .fillColor(item.color)
             .fill();

          // Label
          doc.fillColor('black')
             .fontSize(8)
             .font('Helvetica')
             .text(item.label,
               currentX + legendBoxSize + legendTextPadding,
               currentY,
               {
                 width: 45,
                 align: 'left'
               });
        });
      } else {
        // Two-line layout for schedule pie chart
        const itemsPerRow = Math.ceil(data.length / 2);  // Split items into 2 rows
        const rowSpacing = 15;  // Space between rows
        
        data.forEach((item, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const currentX = legendX + (col * 60);  // Keep 60 points spacing between items
          const currentY = legendY + (row * rowSpacing);  // 15 points between rows

          // Color box
          doc.rect(currentX, currentY, legendBoxSize, legendBoxSize)
             .fillColor(item.color)
             .fill();

          // Label
          doc.fillColor('black')
             .fontSize(8)
             .font('Helvetica')
             .text(item.label,
               currentX + legendBoxSize + legendTextPadding,
               currentY,
               {
                 width: 45,
                 align: 'left'
               });
        });
      }
    } else {
      // Original right-side legend placement
      legendX = centerX + radius + 20;
      legendY = centerY - radius;
      
      data.forEach(item => {
        // Color box
        doc.rect(legendX, legendY, legendBoxSize, legendBoxSize)
           .fillColor(item.color)
           .fill();

        // Label
        doc.fillColor('black')
           .fontSize(8)
           .font('Helvetica')
           .text(item.label,
             legendX + legendBoxSize + legendTextPadding,
             legendY,
             {
               width: 80,
               align: 'left'
             });

        legendY += legendBoxSize + 10;
      });
    }
  } catch (error) {
    console.error('Error drawing pie chart:', error);
  }
}

// Function to draw a bar chart
function drawBarChart(
  doc: CustomPDFKit,
  data: BarChartData[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  title: string,
  isHorizontal: boolean = true
) {
  try {
    // Adjust padding based on whether it's the feedback chart (which needs more label space)
    const isFeedbackChart = title.includes('retroalimentación');
    const padding = { 
      top: 35,  // Increased from 25 to 35 to add more space between title and chart
      right: 10, 
      bottom: 30, 
      left: isFeedbackChart ? 100 : 60
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map(d => d.value));
    
    // Draw title with more space between it and the chart
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(title, startX, startY + 5, {  // Keep startY + 5 to maintain position below line
         width: width,
         align: 'center'
       });

    if (isHorizontal) {
      // Draw horizontal bars with adjusted starting position
      const barHeight = Math.min(15, (chartHeight - (data.length - 1) * 5) / data.length);
      const barSpacing = barHeight + 5;

      data.forEach((item, index) => {
        const barWidth = (item.value / maxValue) * chartWidth;
        const barY = startY + padding.top + index * barSpacing;  // This will now start lower due to increased padding
        const barX = startX + padding.left;

        // Draw label with more space and no text wrapping for feedback chart
        doc.fontSize(8)
           .fillColor('black')
           .text(item.label, 
                startX + 5, 
                barY + (barHeight / 2) - 4,
                { 
                  width: padding.left - 10, 
                  align: 'right',
                  lineBreak: !isFeedbackChart  // Disable line breaks for feedback chart
                });

        // Draw bar
        doc.rect(barX, barY, barWidth, barHeight)
           .fillColor(item.color)
           .fill();

        // Draw value
        if (item.value > 0) {
          doc.fontSize(8)
             .fillColor('black')
             .text(item.value.toString(),
                  barX + barWidth + 5,
                  barY + (barHeight / 2) - 4);
        }
      });
    } else {
      // Vertical bars implementation remains unchanged
      const barWidth = (width - (data.length + 1) * 5) / data.length;
      
      data.forEach((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const barX = startX + 5 + index * (barWidth + 5);
        const barY = startY + (height - 40) - barHeight;

        doc.rect(barX, barY, barWidth, barHeight)
           .fillColor(item.color)
           .fill();

        doc.fontSize(8)
           .fillColor('black')
           .text(item.label, barX, startY + height - 35, {
             width: barWidth,
             align: 'center'
           });

        doc.fontSize(8)
           .text(item.value.toString(), barX, barY - 10, {
             width: barWidth,
             align: 'center'
           });
      });
    }
  } catch (error) {
    console.error('Error drawing bar chart:', error);
  }
}

// Add helper functions to get chart data
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

    // Calculate total for percentage (only used for pie segments)
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

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

    // Calculate total for percentage (only used for pie segments)
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

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

// Add a test endpoint to see the grades distribution data
app.get('/api/test-grades', async (req, res) => {
  try {
    const school = req.query.school as string;
    if (!school) {
      console.log('Missing school parameter');
      return res.status(400).json({ error: 'School parameter is required' });
    }
    
    console.log('Processing request for school:', school);
    
    // First get raw data to debug
    const rawQuery = `
      SELECT grados_asignados, institucion_educativa 
      FROM docentes_form_submissions 
      WHERE institucion_educativa = $1
      LIMIT 5;
    `;
    
    const rawResult = await pool.query(rawQuery, [school]);
    console.log('Raw query results:', JSON.stringify(rawResult.rows, null, 2));
    
    const data = await getGradesDistribution(school);
    res.json({
      school,
      data,
      debug: {
        rawData: rawResult.rows
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 

// Add helper function for grados_estudiantes distribution
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

// Add helper functions for estudiantes charts
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

    const total = result.rows.reduce((sum, row) => sum + row.count, 0);
    console.log('Total count:', total);

    const chartData = result.rows.map(row => {
      const percentage = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0';
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