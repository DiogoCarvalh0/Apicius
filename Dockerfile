FROM node:25-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the API and Web port
EXPOSE 3000

# Start the Node.js server
CMD [ "node", "server.js" ]
