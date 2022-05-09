# Getting Started

## Setup

Recommended environment: Mac+VS Code.

### Running the Code

- Clone the monorepo
- navigate to this folder
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/). I also recommend following [these instructions](https://www.docker.com/blog/speed-boost-achievement-unlocked-on-docker-desktop-4-6-for-mac/) for much faster local filesystem operations.
- run `docker-compose up`
- Load http://localhost:8001/graphql and you should see the GraphQL playground loaded

### Enabling Uploads

We currently use [Storj](https://www.storj.io/) for file storage. You'll need to [create a free Storj account](https://eu1.storj.io/signup), add a bucket, and then [follow these instructions](https://docs.storj.io/dcs/getting-started/quickstart-aws-sdk-and-hosted-gateway-mt/) to generate S3-compatible credentials.

Once you have those credentials you'll need to copy/paste the included [.env.example](./.env.example) file and rename it to `.env`. Then fill in the `STORJ_` environment variables with the information from your specific STORJ account.

## Common Tasks

To start the container:

```
docker-compose up
```

To run a command inside the container:

```
./bin/crun [your command]
```

To SSH into the running container:

```
./bin/cshell
```

When you install a new dependency, you need to make sure it's installed _inside_ the container. You'll also probably want it on your host machine to get TypeScript definitions in the editor, etc. Here's how to do that:

```
yarn add [your package] && ./bin/cpackagesync
```

If your dev environment got messed up somehow and you just want to start over from scratch, try the following command to clear your `node_modules` and reinstall everything:

```
docker-compose up --build --renew-anon-volumes
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
