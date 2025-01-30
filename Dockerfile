FROM node:16-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set permissions for scripts
RUN chmod +x ./libdoc.sh ./sitedoc.sh

# Default command - build develop branch by default
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["./libdoc.sh develop && ./sitedoc.sh"] 