import logger from '../utils/logger.js';
import fetch from 'node-fetch';

async function testEndpoints() {
  logger.info('🧪 Starting API endpoint tests...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Alle Tankstellen abrufen
    logger.info('📡 Test 1: GET /gas-stations');
    const allStationsResponse = await fetch(`${baseUrl}/gas-stations`);
    
    if (!allStationsResponse.ok) {
      throw new Error(`HTTP ${allStationsResponse.status}: ${allStationsResponse.statusText}`);
    }
    
    const allStations = await allStationsResponse.json();
    logger.info(`✅ Success: Found ${allStations.length} gas stations`);
    
    if (allStations.length > 0) {
      logger.info('📋 Sample station:', {
        id: allStations[0].id,
        adresse: allStations[0].adresse,
        latitude: allStations[0].latitude,
        longitude: allStations[0].longitude
      });
    }
    
    // Test 2: Umkreis-Suche (2km um Kölner Dom)
    logger.info('\n📡 Test 2: GET /gas-stations/nearby (2km um Kölner Dom)');
    const nearbyUrl = `${baseUrl}/gas-stations/nearby?lat=50.9413&lng=6.9583&radius=2000`;
    const nearbyResponse = await fetch(nearbyUrl);
    
    if (!nearbyResponse.ok) {
      throw new Error(`HTTP ${nearbyResponse.status}: ${nearbyResponse.statusText}`);
    }
    
    const nearbyStations = await nearbyResponse.json();
    logger.info(`✅ Success: Found ${nearbyStations.length} stations within 2km`);
    
    // Test 3: Umkreis-Suche (5km)
    logger.info('\n📡 Test 3: GET /gas-stations/nearby (5km)');
    const nearby5kmUrl = `${baseUrl}/gas-stations/nearby?lat=50.9413&lng=6.9583&radius=5000`;
    const nearby5kmResponse = await fetch(nearby5kmUrl);
    const nearby5kmStations = await nearby5kmResponse.json();
    logger.info(`✅ Success: Found ${nearby5kmStations.length} stations within 5km`);
    
    // Test 4: Fehlerbehandlung (fehlende Parameter)
    logger.info('\n📡 Test 4: Error handling (missing parameters)');
    const errorResponse = await fetch(`${baseUrl}/gas-stations/nearby?lat=50.9413`); // lng fehlt
    
    if (errorResponse.status === 400) {
      const errorData = await errorResponse.json();
      logger.info('✅ Success: Error handling works correctly');
      logger.info('📋 Error message:', errorData.error);
    } else {
      logger.info('❌ Error handling test failed');
    }
    
    // Test 5: Entfernungen prüfen (falls vorhanden)
    if (nearbyStations.length > 0 && nearbyStations[0].distance_km !== undefined) {
      logger.info('\n📏 Distance calculations:');
      nearbyStations.slice(0, 3).forEach((station, index) => {
        logger.info(`  ${index + 1}. ${station.adresse} - ${station.distance_km.toFixed(2)}km`);
      });
    }
    
    // Zusammenfassung
    logger.info('\n🎉 All API tests completed successfully!');
    logger.info(`📊 Total stations: ${allStations.length}`);
    logger.info(`📊 Within 2km: ${nearbyStations.length}`);
    logger.info(`📊 Within 5km: ${nearby5kmStations.length}`);
    
  } catch (error) {
    logger.info('\n❌ Test FAILED with error:');
    logger.error(error.message);
  }
}

// Test ausführen
testEndpoints();