const { Pool } = require('pg');

console.log('🔍 Probando conexión básica a PostgreSQL...');

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
    console.log('🔌 Intentando conectar...');
    const client = await pool.connect();
    console.log('✅ ¡Conexión exitosa!');
    
    const result = await client.query('SELECT version();');
    console.log('📋 PostgreSQL version:', result.rows[0].version);
    
    client.release();
    await pool.end();
    console.log('🎉 Test completado');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('📝 Detalles del error:', error);
  }
}

testConnection();
