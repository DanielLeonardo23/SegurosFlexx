const { Pool } = require('pg');

// Configuración de PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'segurosflex',
  user: 'postgres',
  password: 'admin123',
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL!');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Hora actual:', result.rows[0].current_time);
    console.log('🐘 Versión PostgreSQL:', result.rows[0].pg_version);
    
    client.release();
    
    // Probar listado de tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tablas disponibles:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await pool.end();
    console.log('🔚 Conexión cerrada.');
  }
}

testConnection();
