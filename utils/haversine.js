/**
 * Haversine formula to calculate the distance between two points on the Earth
 * given their latitude and longitude.
 * @param {number} latitude - The latitude of the point to search from.
 * @param {number} longitude - The longitude of the point to search from.
 * @param {number} distance - The distance in kilometers to search within.
 * @return {string} - The SQL query string.
 * 
 * this query is no longer in use, as postGIS was implemented for better performance
 */
const haversine = `
  SELECT *, 
    (6371 * acos(
      cos(radians($1)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians($2)) + 
      sin(radians($1)) * sin(radians(latitude))
    )) AS distance_km
  FROM gas_stations
  WHERE (6371 * acos(
    cos(radians($1)) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians($2)) + 
    sin(radians($1)) * sin(radians(latitude))
  )) <= $3
  ORDER BY distance_km;
`;

export default haversine;