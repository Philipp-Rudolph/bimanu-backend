FROM node:18-alpine

WORKDIR /app

# Package files kopieren (für besseres Caching)
COPY package*.json ./

# Dependencies installieren und Sicherheitsupdates anwenden
RUN npm install && npm audit fix --force

# Source code kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# Mit nodemon starten
CMD ["npm", "run", "dev"]
