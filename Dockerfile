# Set Bun and Node version
ARG BUN_VERSION=1.1.20
ARG NODE_VERSION=20.12.2
FROM imbios/bun-node:${BUN_VERSION}-${NODE_VERSION}-slim

# Set production environment
ENV NODE_ENV="production"

# Bun app lives here
WORKDIR /app

# Copy app files to app directory
COPY . .

# Install node modules
RUN bun install

# Generate Prisma Client
RUN bunx prisma generate
RUN bunx prisma db push

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "run", "index.ts" ]