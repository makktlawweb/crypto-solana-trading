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

# Copy the production server over the development one
RUN cp server/index.simple.ts server/index.ts

# Remove vite.ts file to prevent any imports
RUN rm -f server/vite.ts

# Bundle the production server
RUN ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Clean up devDependencies
RUN npm prune --production

# Expose port 5000 (matches your app)
EXPOSE 5000

# Start the application directly
CMD ["npm", "start"]