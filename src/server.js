import express, { json } from 'express';
import 'dotenv/config';

import { importGasStations } from './import-service.js';
const { pool } = await import('./database.js');
import logger from '../utils/logger.js';
// import haversine from '../utils/haversine.js';
import postgisQuery from '../utils/postgis.js';

const app = express();
const port = 3000;

app.use(json());


/**
 * Health check endpoint for monitoring service status
 * Returns server status, timestamp, and environment information
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
    },
  });
});

/**
 * Database connectivity test endpoint
 * Verifies database connection and returns current timestamp
 */
app.get('/db-test', async (req, res) => {
  try {
    const { pool } = await import('./database.js');
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'Database connected', 
      time: result.rows[0].now, 
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message, 
    });
  }
});

/**
 * Manual data import trigger endpoint
 * Allows manual triggering of gas station data import
 */
app.post('/import', async (req, res) => {
  await importGasStations();
  res.json({ message: 'Import completed' });
});

/**
 * Schedule automatic data import every hour
 * Ensures gas station data stays up-to-date
 */
global.setInterval(importGasStations, 60 * 60 * 1000);

/**
 * Root endpoint with service information
 * Provides basic information about the service
 */
app.get('/', (req, res) => {
  res.send('Gas Station Import Service is running. Use `curl -X POST http://localhost:3000/import` to trigger an import.');
  res.status(200);
});

/**
 * Get all gas stations endpoint
 * Returns all gas stations stored in the database
 */
app.get('/gas-stations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gas_stations');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching gas stations:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Find nearby gas stations using PostGIS geospatial queries
 * @param {number} lat - Latitude coordinate (required)
 * @param {number} lng - Longitude coordinate (required)  
 * @param {number} radius - Search radius in meters (optional, default: 1000)
 * @returns {Array} Array of nearby gas stations with distance
 * @example GET /gas-stations/nearby?lat=50.9413&lng=6.9583&radius=2000
 */
app.get('/gas-stations/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const radiusKm = (radius || 1000) / 1000; // Default 1km

    const query = postgisQuery;
    
    const result = await pool.query(query, [lat, lng, radiusKm]);
    
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching nearby gas stations:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Initialize server with initial data import
 * Runs gas station data import on server startup to ensure database is populated
 */
async function initializeServer() {
  try {
    logger.info('Starting initial data import...');
    await importGasStations();
    logger.info('Initial data import completed');
  } catch (error) {
    logger.error('Failed to import initial data:', error.message);
  }
}

app.listen(port, async () => {
  logger.info(`Server running at http://localhost:${port}`);
  await initializeServer();
});
