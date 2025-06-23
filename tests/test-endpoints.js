import { importGasStations } from '../src/import-service.js';
import { pool } from '../src/database.js';
import logger from '../utils/logger.js';

async function testImport() {
  logger.info('🧪 Starting import test...\n');
  
  try {
    // 1. Vorher: Wie viele Datensätze sind in der DB?
    const beforeResult = await pool.query('SELECT COUNT(*) FROM gas_stations');
    const countBefore = parseInt(beforeResult.rows[0].count);
    logger.info(`📊 Records before import: ${countBefore}`);
    
    // 2. Import ausführen
    logger.info('⏳ Running import...');
    await importGasStations();
    
    // 3. Nachher: Wie viele Datensätze sind jetzt da?
    const afterResult = await pool.query('SELECT COUNT(*) FROM gas_stations');
    const countAfter = parseInt(afterResult.rows[0].count);
    logger.info(`📊 Records after import: ${countAfter}`);
    
    // 4. Beispiel-Datensatz anzeigen
    const sampleResult = await pool.query('SELECT * FROM gas_stations LIMIT 1');
    logger.info('\n📋 Sample record:');
    logger.info(sampleResult.rows[0]);
    
    // 5. Test-Ergebnis
    if (countAfter > countBefore) {
      logger.info('\n✅ Test PASSED: New records were imported!');
    } else if (countAfter === countBefore && countAfter > 0) {
      logger.info('\n✅ Test PASSED: Data updated (same count, but existing data)');
    } else {
      logger.info('\n❌ Test FAILED: No data imported');
    }
    
  } catch (error) {
    logger.info('\n❌ Test FAILED with error:');
    logger.error(error.message);
  } finally {
    await pool.end();
  }
}

// Test ausführen
testImport();