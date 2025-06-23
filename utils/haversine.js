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