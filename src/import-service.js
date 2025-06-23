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
      INSERT INTO gas_stations (object_id, adresse, geometry, longitude, latitude)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (object_id) DO UPDATE SET
        adresse = EXCLUDED.adresse,
        geometry = EXCLUDED.geometry,
        longitude = EXCLUDED.longitude,
        latitude = EXCLUDED.latitude
    `;
    
    for (const feature of features) {
      await client.query(insertQuery, [
        feature.object_id,
        feature.adresse,
        feature.geometry,
        feature.longitude,
        feature.latitude
      ]);
    }
    
    await client.query('COMMIT');

    logger.info(`Successfully imported ${features.length} gas stations`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error importing gas stations:', error);
    throw error;
  } finally {
    client.release();
  }
}

function transformFeatures(data) {
  return data.features.map(feature => ({
    object_id: feature.attributes.objectid,
    adresse: feature.attributes.adresse,
    geometry: JSON.stringify(feature.geometry),
    longitude: feature.geometry?.x,
    latitude: feature.geometry?.y,
  }));
}

async function importGasStations() {
  try {
    logger.info('Starting gas station import...');

    const data = await fetchData();
    const features = transformFeatures(data);

    logger.info(`Importing ${features.length} gas stations`);
    await saveFeaturesToDatabase(features);

    logger.info('Import completed successfully');
  } catch (error) {
    logger.error('Import failed:', error.message);
    throw error;
  }
}

export { importGasStations };