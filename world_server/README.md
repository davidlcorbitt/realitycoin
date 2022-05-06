# Getting Started

## Setup

Recommended environment: Mac+VS Code.

- Clone the monorepo
- navigate to this folder
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/). I also recommend following [these instructions](https://www.docker.com/blog/speed-boost-achievement-unlocked-on-docker-desktop-4-6-for-mac/) for much faster local filesystem operations.
- run `docker-compose up`
- Load http://localhost:8001/graphql and you should see the GraphQL playground loaded

## Common Tasks

To start the container:

```
docker-compose up
```

To run a command inside the container:

```
docker exec -it wserver [your command]
```

To SSH into the running container:

```
docker exec -it wserver /bin/bash
```

When you install a new dependency, you need to install it _inside_ the container, like so:

```
docker exec -it wserver yarn add [your package]
```

That said, it's generally useful to keep the packages on your host machine synced as well so eg. TypeScript definitions remain up to date within VS Code. So you can add a package on the dev machine and sync it to the host by running the following:

```
docker exec -it wserver yarn add [your package] && yarn install
```

## Inspecting the Database

As a convenience the docker-compose configuration installs [pgAdmin](https://www.pgadmin.org/). You can use it to inspect the database by doing the following:

- visit http://localhost:8011/
- For the password just type `admin`
- Click "Add New Server"
- For "Name" enter `world_server`
- Click the "Connection" tab, and fill out the fields as follows. Any other fields you can leave as default.
  - Hostname/address: `postgres`
  - Port: `5432`
  - Username: `world_server`
  - Password: `world_server`
  - Save password?: yes
- Click "Save"

Alternatively, you can use `psql` or any database frontend you want from your host machine by connecting to the dev database at `postgres://world_server:world_server@localhost:8010/world_server`
