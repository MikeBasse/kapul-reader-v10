# Build stage - Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install for compatibility)
RUN npm install

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Production stage - Run the server
FROM node:20-alpine AS production

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --omit=dev

# Copy built frontend from builder stage
WORKDIR /app
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server/index.js ./server/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE 3001

# Start the server
WORKDIR /app/server
CMD ["node", "index.js"]
