Docker configuration could be confusing to start with.<br>
This repo can be used as a reference to practice to actually get started with Docker.

## Overview
This is a fullstack web application.<br>
It is built with pretty common stack.

- Next.js
- Express.js
- PostgreSQL

A client, server, and database run in containers.<br>
The client makes an api call to the server.<br>
The server talks to the database.<br>

At the end of this document, you will be able to create and run a fullstack web application completely in a container.

## Key Concepts about Docker to Cover
What we want to do with Docker is basically to create a virtual environment (`container`) from an `image` and put all the code and dependencies, and run the app in there. By doing so, the app does not depend on your local machine at all, and all the team members can use the same environment to develop an app! There will not be "oh-it-works-on-my-computer" problem :)
- `image` is a blueprint which has a configuration of a virtual environment like `Node.js` and so. We fetch the image and Docker provides it.
- `container` is an instance of an `image`.
<br>

There are 2 important files involved in the process.
- `Dockerfile` is instantiating an `image` to create a `container`.
- `docker-compose.yml` handles orchestration of multiple conatiners.
Each container lives in their own encapsulated environment, and it is impossible for them to talk to each other. `docker-compose.yml` configure inter-container interactions.
<br>

These are the commands to use.<br>
```
docker-compose up --build
```
Docker looks for `Dockerfile`s referring the `docker-compose.yml` and **set up containers** based on the configuration, and **run commands** specified in these files. `--build` flag tells docker to build again. While running the app, build files are referenced. If a change is added to a code, a new package is installed, or some other changes are made in our local machine, this needs to be reflected in the containers too.
Code changes can be tracked dynamically, but package installation is not. Running `npm install` locally does not install any packages in a container. To update the container with the latest package.json, run `docker-compose up --build` and `Dockerfile.client` tells Docker to install the packages, thanks to `RUN npm install` line.
>[!NOTE]
>Detail will covered in the Client Side section with an example.

```
docker-compose down
```
This shuts down the running containers.<br>
It should be run when you:

- want to / installed a new package -> shut down the containers and run `docker-compose up --build` to refresh.
- finish working and are ready to grab a drink.

These are the key concepts to understand before diving into the steps :)

## Project Structure
```
this-project/
  client/ -> next.js project
  server/ -> typescript project (express)
  docker/
    Dockerfile.client
    Dockerfile.server
  .dockerignore
  docker-compose.yml
```

This is displayed here to grasp the whole picture🗾.<br>
Let's work on them one by one, starting with the client side.

## Client Side
Create a next.js project in a local machine.
```
cd client
npx create-next-app .
```

`this-project/docker/Dockerfile.client`
```
# Specifying node.js environment. 18-alpine is just one of node.js images. Don't cover the detail here.
FROM node:18-alpine

# Set the working directory inside the container
# Docker thinks /app as a root of a client side project, and it is equivalent to /client in our local machine.
WORKDIR /app

# Copy package.json and package-lock.json for Next.js dependencies
# The container has a latest package.json copied from the local machine.
COPY client/package*.json ./

# Install dependencies in the container
RUN npm install

# Copy all the code except node_modules of the application code (as specified in .dockerignore)
# Copying node_modules directory is too heavy.
# After running npm install, files which already exist in node_modules are not installed again, and this make the synchronization process faster than copying all the code.
COPY client/ .

# Expose the Next.js default port
EXPOSE 3000

# Run Next.js development server
CMD ["npm", "run", "dev"]
```

`this-project/docker-compose.yml`
```
# Latest docker version
version: '3'


services:

  # name of the service. we call it "client" here
  client:
    build:
      # Location of the build file in the container
      context: .
      # specify the location of the docker file for the client
      dockerfile: docker/Dockerfile.client
    volumes:
      # ./client in the local machine is synced with /app in the container
      - ./client:/app
      # safeguard. Make sure local node_moduls in the local machine does not overwrite the node_modules in the container.
      - /app/node_modules
    ports:
      # host port: container port
      # container is accesible from local machine via port 3000
      # the client app in the container is running and exposed to port 3000
      - "3000:3000"
```

## Server Side
Pretty much the same as the client side.
Install packages.<br>
`package.json`
```
{
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^22.5.5",
    "@types/pg": "^8.11.10",
    "nodemon": "^3.1.5", -> to motnitor changes in the code while developing
    "ts-node": "^10.9.2",
    "typescript": "^5.6.2"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "pg": "^8.13.0"
  },
  "scripts": {
    "dev": "nodemon ./index.ts"
  }
}
```
`this-project/server/Dockerfile.server`
```
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm install

COPY server/ .

EXPOSE 8080

CMD ["npm", "run", "start"]
```
`this-project/docker-compose.yml`
```
version: '3'
services:
  client:
   ...
  
  server:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    volumes:
      - ./server:/app
      - /app/node_modules
    ports:
      - "8080:8080"
    depends_on:
      # Wait for db to be set up before setting up the server
      - db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: db
      DB_HOST: db
```
## Database
Just add these lines in `this-project/docker-compose.yml`
```
version: '3'
services:
  client:
    ...
  
  server:
    ...

  db:
    image: postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
  
volumes:
  # Use this volume to persist data across different builds
  pgdata:
```

## Time to run the containers!
Start the desktop docker app.
Run
```
docker-compose up --build
```
