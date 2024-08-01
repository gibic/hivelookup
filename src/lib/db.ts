import { config as dotenvConfig } from 'dotenv';
import sql from 'mssql';

dotenvConfig();

const config: sql.config = {
    user: process.env.DB_USER || 'your_username',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'your_server',
    database: process.env.DB_DATABASE || 'your_database',
    options: {
        encrypt: false,
        trustServerCertificate: false,
    },
};

export const connectToDatabase = async (): Promise<void> => {
    try {
        await sql.connect(config);
        console.log('Connected to the database');
    } catch (err) {
        console.error('Database connection failed: ', err);
        throw err;
    }
};