/**
 * PostGIS query to find gas stations within a specified distance from a given latitude and longitude.
 * @param {number} latitude - The latitude of the point to search from.
 * @param {number} longitude - The longitude of the point to search from.
 * @param {number} distance - The distance in kilometers to search within.
 * @returns {string} - The SQL query string.
 */
const postgisQuery = `
  SELECT 
    id,
    object_id,
    adresse,
    longitude,
    latitude,
    (ST_Distance(
      geometry::geography,
      ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
    ) / 1000) AS distance_km
  FROM gas_stations
  WHERE ST_DWithin(
    geometry::geography,
    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
    $3 * 1000
  )
  ORDER BY geometry::geography <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography;
`;
export default postgisQuery;