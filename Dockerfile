FROM node:bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Copy all files (not just package.json)
COPY . .

# Install dependencies
RUN npm install

# Expose the port Northflank uses
EXPOSE 8080

# Start your app
CMD ["node", "index.js"]
