const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
   //Neon requires SSL connections, but its certificate 
   //doesn't pass strict validation in Node's default SSL check. This line says "use SSL, but don't reject the connection over the certificate.
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;