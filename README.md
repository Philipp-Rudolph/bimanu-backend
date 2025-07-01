# Bimanu Backend

A Node.js backend service for managing gas station data with geospatial functionality. This service fetches gas station data from the City of Cologne's open data API and provides REST endpoints for querying nearby gas stations.

## 🚀 Features

- **Automated Data Import**: Fetches gas station data from Cologne's open data API
- **Geospatial Queries**: Find nearby gas stations using PostGIS
- **RESTful API**: Clean endpoints for data access
- **Docker Support**: Easy deployment with Docker Compose
- **Comprehensive Testing**: Unit tests and integration tests included
- **Modern Node.js**: ES modules, async/await, and modern JavaScript features

## 📋 Requirements

- Node.js 18+
- PostgreSQL with PostGIS extension
- Docker and Docker Compose (recommended)

## 🛠️ Installation & Setup

### Option 1: Docker Compose (Recommended)

1. **Start the services:**
   ```bash
   docker compose up -d
   ```

2. **The backend will automatically:**
   - Start the PostgreSQL database with PostGIS
   - Initialize the database schema
   - Import initial gas station data
   - Start the web server on port 3000

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start PostgreSQL with PostGIS**

4. **Run the application:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | Database host |
| `DB_USER` | `postgres` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `DB_NAME` | `postgres` | Database name |
| `DB_PORT` | `5432` | Database port |
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `NODE_ENV` | `development` | Node environment |

## 🌐 API Endpoints

### Health Check
```http
GET /health
```
Returns server status and environment information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "env": {
    "NODE_ENV": "development",
    "DB_HOST": "db"
  }
}
```

### Database Test
```http
GET /db-test
```
Tests database connectivity.

**Response:**
```json
{
  "status": "Database connected",
  "time": "2024-01-01T12:00:00.000Z"
}
```

### Get All Gas Stations
```http
GET /gas-stations
```
Returns all gas stations in the database.

**Response:**
```json
[
  {
    "id": 1,
    "object_id": 12345,
    "adresse": "Musterstraße 1, 50667 Köln",
    "longitude": 6.9583,
    "latitude": 50.9413
  }
]
```

### Find Nearby Gas Stations
```http
GET /gas-stations/nearby?lat=50.9413&lng=6.9583&radius=2000
```

**Parameters:**
- `lat` (required): Latitude coordinate
- `lng` (required): Longitude coordinate  
- `radius` (optional): Search radius in meters (default: 1000m)

**Response:**
```json
[
  {
    "id": 1,
    "object_id": 12345,
    "adresse": "Musterstraße 1, 50667 Köln",
    "longitude": 6.9583,
    "latitude": 50.9413,
    "distance_km": 0.5
  }
]
```

### Manual Data Import
```http
POST /import
```
Manually triggers a data import from the external API.

**Response:**
```json
{
  "message": "Import completed"
}
```

## 📊 Data Import

The service automatically imports gas station data from the City of Cologne's open data API:

- **URL**: `https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query`
- **Format**: ArcGIS REST API (GeoJSON-like)
- **Frequency**: Every hour (configurable)
- **Initial Import**: On server startup

### Data Processing

1. **Fetch**: Downloads data from the external API
2. **Transform**: Converts coordinates and extracts relevant fields
3. **Validate**: Ensures data quality and completeness
4. **Upsert**: Updates existing records or inserts new ones
5. **Log**: Provides detailed logging of the import process

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Import Test
```bash
npm run test:import
```

### Run Endpoint Tests
```bash
npm run test:endpoints
```

### Docker Testing
```bash
# Run tests in Docker container
docker compose exec backend npm test
```

## 🗄️ Database Schema

### Table: `gas_stations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `object_id` | INTEGER UNIQUE | External API object ID |
| `adresse` | TEXT | Gas station address |
| `longitude` | DECIMAL | Longitude coordinate |
| `latitude` | DECIMAL | Latitude coordinate |
| `geometry` | GEOMETRY(POINT, 4326) | PostGIS geometry column |

### Indexes

- Primary key on `id`
- Unique constraint on `object_id`
- Spatial index on `geometry` for fast geospatial queries

## 🔍 Development

### Code Quality

The project uses ESLint for code quality:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### File Structure

```
bimanu-backend/
├── src/
│   ├── server.js          # Main server file
│   ├── database.js        # Database connection
│   └── import-service.js  # Data import logic
├── utils/
│   ├── logger.js          # Winston logger configuration
│   ├── postgis.js         # PostGIS queries
│   └── haversine.js       # Distance calculation utilities
├── tests/
│   ├── test-db-import.js  # Import functionality tests
│   └── test-endpoints.js  # API endpoint tests
├── docker-compose.yml     # Docker services configuration
├── Dockerfile             # Production Docker image
├── Dockerfile.prod        # Optimized production image
└── eslint.config.js       # ESLint configuration
```

### Logging

The application uses Winston for structured logging:

- **Console output**: Colorized logs with timestamps
- **Log levels**: error, warn, info, debug
- **Format**: `[HH:mm:ss] LEVEL: message`

### PostGIS Integration

The service leverages PostGIS for efficient geospatial operations:

- **ST_Distance**: Calculate distances between points
- **ST_DWithin**: Find points within a specified distance
- **ST_MakePoint**: Create geometry points from coordinates
- **Geography casting**: For accurate distance calculations

## 🚀 Deployment

### Production Docker Build

```bash
# Build production image
docker build -f Dockerfile.prod -t bimanu-backend:latest .

# Run production container
docker run -p 3000:3000 bimanu-backend:latest
```

### Environment Setup

1. Set up PostgreSQL with PostGIS extension
2. Configure environment variables
3. Ensure network connectivity to external data source
4. Set up monitoring and logging (optional)

## 🤝 Contributing

1. Follow the existing code style (ESLint configuration)
2. Write tests for new functionality
3. Update documentation for API changes
4. Use conventional commit messages

## 📄 License

This project is part of the Bimanu application suite.

---

## 🔧 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check if PostgreSQL is running
- Verify database credentials in environment variables
- Ensure PostGIS extension is installed

**Import Fails**
- Check network connectivity to external API
- Verify SSL settings if using HTTPS
- Check database permissions for INSERT operations

**No Data Returned**
- Verify data was imported successfully
- Check coordinate system (WGS84/EPSG:4326)
- Ensure search radius is appropriate

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Checks

Monitor service health:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/db-test
```