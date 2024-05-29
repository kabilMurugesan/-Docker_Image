# goBox-rest-api
goBox-rest-api

Install the dependencies:

```bash
yarn install
```

Set the environment variables:

```bash
cp env.example .env

# open .env and modify the environment variables (if needed)
```

## Commands

Running locally:

```bash
yarn dev
```

Running in production:

```bash
yarn start
```

Docker:

```bash

Linting:

```bash
# run ESLint
yarn lint

# fix ESLint errors
yarn lint:fix

# run prettier
yarn prettier

# fix prettier errors
yarn prettier:fix
```

## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Port number
PORT=8085

# MYSQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gobox
DB_USERNAME=root
DB_PASSWORD=

#Seed
Run npm seed in terminal to create data for users

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--middlewares\    # Custom express middlewares
 |--models\         # Sequelize models (data layer)
 |--routes\         # Routes
 |--utils\          # Utility classes and functions
 |--validations\    # Request data validation schemas
 |--app.js          # Express app
 |--index.js        # App entry point
```

## License

[MIT](LICENSE)
