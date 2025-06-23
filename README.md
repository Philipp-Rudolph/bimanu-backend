# Bimanu Backend 

## Commands 

### Start the backend server

```bash
docker compose up -d
```

### Start the db

```bash
docker compose up -d db
```

### Stop the backend server

```bash
docker compose down
```

### curl the import 

```bash
curl -X POST http://localhost:3000/import
```

### run the import test 

```bash
docker compose exec backend npm run test-import
``` 

### run the endpoints test 

```bash
docker compose exec backend npm run test-endpoints
```

### run all tests

```bash
docker compose exec backend npm run test
```