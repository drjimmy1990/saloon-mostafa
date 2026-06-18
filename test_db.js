const { Client } = require('pg');

async function test() {
  const connectionString = 'postgresql://postgres.havgzkklfiengdxsyqmf:bQG1WaZzJMfZ820N@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Successfully connected to Supabase using standard password on eu-west-1!');
    await client.end();
  } catch (error) {
    console.error('Failed to connect:', error.message);
  }
}

test();
