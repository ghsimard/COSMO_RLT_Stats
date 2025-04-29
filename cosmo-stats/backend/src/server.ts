import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { FrequencyData, SectionConfig, GridItem, FrequencyResult } from './types';
import { QueryResult } from 'pg';

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

async function calculateFrequencies(tableName: string, question: string, section: string): Promise<FrequencyResult> {
  if (question === 'NA') {
    return { S: -1, A: -1, N: -1 };
  }

  const columnName = getColumnName(section);
  const query = `
    SELECT 
      key as question,
      LOWER(TRIM(value)) as rating,
      COUNT(*) as count
    FROM ${tableName},
      jsonb_each_text(${columnName}) as x(key, value)
    WHERE key = $1
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

    const { rows } = await pool.query(query, [question]);
    
    // Log raw results
    console.log(`Raw Results:`, JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log(`WARNING: No results found for question "${question}" in table ${tableName}`);
      // Try a broader query to see what questions exist
      const checkQuery = `
        SELECT DISTINCT key, COUNT(DISTINCT value) as value_count
        FROM ${tableName},
          jsonb_each_text(${columnName}) as x(key, value)
        GROUP BY key
        LIMIT 5;
      `;
      const { rows: checkRows } = await pool.query(checkQuery);
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
    console.error(`Failed query parameters:`, { tableName, question, section, columnName });
    return { S: -1, A: -1, N: -1 }; // Indicate error condition
  }
}

app.get('/api/frequency-ratings', async (req, res) => {
  try {
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
            docentes: await calculateFrequencies('docentes_form_submissions', item.questionMappings.docentes, sectionKey),
            estudiantes: await calculateFrequencies('estudiantes_form_submissions', item.questionMappings.estudiantes, sectionKey),
            acudientes: await calculateFrequencies('acudientes_form_submissions', item.questionMappings.acudientes, sectionKey)
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 