const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'COSMO_RLT',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

console.log('Attempting to connect to database with config:', {
  ...dbConfig,
  password: '***' // Hide password in logs
});

const pool = new Pool(dbConfig);

// Test the connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

async function getTableColumns(tableName) {
  const query = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
  `;
  
  try {
    const { rows } = await pool.query(query, [tableName]);
    console.log(`Found columns for table ${tableName}:`, rows.map(r => r.column_name));
    return rows.map(row => row.column_name);
  } catch (error) {
    console.error(`Error getting columns for table ${tableName}:`, error);
    throw error;
  }
}

module.exports = { pool, getTableColumns }; 