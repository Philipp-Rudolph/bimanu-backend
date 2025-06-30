import { pool } from './database.js';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const CONFIG = {
  DATA_URL: 'https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query?where=objectid+is+not+null&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&distance=&units=esriSRUnit_Foot&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&havingClause=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=pjson',
  SSL_DISABLED: true,
};

if (CONFIG.SSL_DISABLED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function fetchData() {
  const response = await fetch(CONFIG.DATA_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function saveFeaturesToDatabase(features) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const insertQuery = `
      INSERT INTO gas_stations (object_id, adresse, longitude, latitude, geometry)
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($3, $4), 4326))
      ON CONFLICT (object_id) DO UPDATE SET
        adresse = EXCLUDED.adresse,
        longitude = EXCLUDED.longitude,
        latitude = EXCLUDED.latitude,
        geometry = ST_SetSRID(ST_MakePoint(EXCLUDED.longitude, EXCLUDED.latitude), 4326)
    `;
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const feature of features) {
      try {
        if (!feature.longitude || !feature.latitude || 
            isNaN(feature.longitude) || isNaN(feature.latitude)) {
          logger.warn(`Skipping feature ${feature.object_id}: Invalid coordinates`);
          skippedCount++;
          continue;
        }
        
        await client.query(insertQuery, [
          feature.object_id,
          feature.adresse,
          feature.longitude,
          feature.latitude
        ]);
        
        importedCount++;
      } catch (error) {
        logger.error(`Error importing feature ${feature.object_id}:`, error.message);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');

    logger.info(`Successfully imported ${importedCount} gas stations, skipped ${skippedCount}`);
    return { imported: importedCount, skipped: skippedCount };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error importing gas stations:', error);
    throw error;
  } finally {
    client.release();
  }
}

function transformFeatures(data) {
  if (!data.features || !Array.isArray(data.features)) {
    throw new Error('Invalid data format: features array not found');
  }
  
  return data.features.map(feature => {
    const longitude = feature.longitude;
    const latitude = feature.latitude;

    return {
      object_id: feature.attributes?.objectid,
      adresse: feature.attributes?.adresse || 'Adresse nicht verfügbar',
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
    };
  }).filter(feature => {
    return feature.object_id && 
           feature.longitude !== null && 
           feature.latitude !== null &&
           !isNaN(feature.longitude) && 
           !isNaN(feature.latitude);
  });
}

async function validateDatabaseConnection() {
  try {
    const client = await pool.connect();
    
    const postgisCheck = await client.query("SELECT PostGIS_Version()");
    logger.info('PostGIS Version:', postgisCheck.rows[0].postgis_version);
    
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gas_stations'
    `);
    
    if (tableCheck.rows.length === 0) {
      throw new Error('Table gas_stations does not exist');
    }
    
    logger.info('Database validation successful');
    client.release();
    
  } catch (error) {
    logger.error('Database validation failed:', error.message);
    throw error;
  }
}

async function importGasStations() {
  try {
    logger.info('Starting gas station import...');
    
    await validateDatabaseConnection();

    const data = await fetchData();
    logger.info(`Fetched ${data.features?.length || 0} features from API`);
    
    const features = transformFeatures(data);
    logger.info(`Transformed and validated ${features.length} features`);
    
    if (features.length === 0) {
      logger.warn('No valid features to import');
      return { imported: 0, skipped: 0 };
    }

    const result = await saveFeaturesToDatabase(features);
    
    logger.info('Import completed successfully');
    return result;
    
  } catch (error) {
    logger.error('Import failed:', error.message);
    throw error;
  }
}

export { importGasStations };