# Used Node.js 
FROM node:22

# Create Workdir for Application
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to WORKDIR
COPY package*.json ./

# Instal Dependencies
RUN npm install

# Copy All code to WORKDIR
COPY . .

# Expose port used by Application
EXPOSE 8080

# Command run Application
CMD ["npm", "run", "start"]
