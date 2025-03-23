import postgres from 'postgres';

const connectionString = 'postgresql://postgres:mysecretpassword@localhost:5432/postgres';

const sql = postgres(connectionString, {
	max: 1,
	idle_timeout: 20,
	connect_timeout: 30
});

async function testConnection() {
	try {
		// Drop the database if it exists
		await sql`DROP DATABASE IF EXISTS local`;
		console.log('Dropped existing database if it existed');

		// Create the database
		await sql`CREATE DATABASE local`;
		console.log('Created database local');

		// Test the connection
		const result = await sql`SELECT current_database()`;
		console.log('Connected to database:', result[0].current_database);
	} catch (error) {
		console.error('Connection error:', error);
	} finally {
		await sql.end();
	}
}

testConnection();
