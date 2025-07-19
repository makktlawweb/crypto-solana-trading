FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Build directly without npm scripts to avoid PATH issues
RUN ./node_modules/.bin/vite build
RUN ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Clean up devDependencies
RUN npm prune --production

# Expose port 5000 (matches your app)
EXPOSE 5000

# Create startup script that runs database migration then starts app
RUN echo '#!/bin/sh\n\
if [ -n "$DATABASE_URL" ]; then\n\
  echo "Running database migration..."\n\
  npx drizzle-kit push\n\
fi\n\
echo "Starting application..."\n\
npm start' > start.sh && chmod +x start.sh

# Start with database migration
CMD ["./start.sh"]