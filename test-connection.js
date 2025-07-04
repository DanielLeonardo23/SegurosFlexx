const { Pool } = require('pg');

const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'segurosflex',
  user: 'postgres',
  password: 'admin123',
  ssl: false,
  connectionTimeoutMillis: 15000,
});

async function testConnection() {
  console.log('🔍 Probando conexión a PostgreSQL...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexión establecida exitosamente');
    
    const result = await client.query('SELECT version();');
    console.log('📝 PostgreSQL version:', result.rows[0].version);
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📊 Tablas disponibles:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => console.log('  -', row.table_name));
    
    client.release();
    console.log('🎉 Test de conexión completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔧 Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
