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