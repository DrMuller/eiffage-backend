# Express TypeScript Authentication Scaffolding

A clean scaffolding project for building Express.js applications with TypeScript, featuring a complete authentication system with JWT tokens and MongoDB integration.

## Features

- 🔐 **Authentication System**
  - User registration and login
  - JWT-based authentication (access & refresh tokens)
  - Password reset functionality with email notifications
  - Role-based access control (USER, ADMIN roles)

- 🏗️ **Modern Tech Stack**
  - Express.js with TypeScript
  - MongoDB with native driver
  - Docker Compose for local development
  - Jest for testing
  - ESLint & Prettier for code quality

- 📧 **Email Notifications**
  - Brevo (SendinBlue) integration
  - Password reset emails
  - Easily extensible for other notifications

- 🛡️ **Security Features**
  - Helmet.js for security headers
  - CORS configuration
  - Rate limiting ready
  - Password hashing with bcrypt
  - Environment variable validation with Zod

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Yarn or npm
- Brevo account for email services (optional)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd express-auth-scaffolding
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values according to your setup.

4. **Start MongoDB with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   yarn migration
   # or
   npm run migration
   ```

6. **Start the development server**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Project Structure

```
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── controller/       # Route controllers
│   │   ├── dto/             # Data transfer objects
│   │   ├── model/           # Database models
│   │   ├── routes/          # Route definitions
│   │   └── service/         # Business logic
│   ├── middleware/          # Express middlewares
│   ├── migrations/          # Database migrations
│   ├── notification/        # Email notification service
│   ├── utils/              # Utility functions
│   ├── app.config.ts       # Application configuration
│   └── server.ts           # Server entry point
├── docker-compose.yml      # Docker configuration
├── .env.example           # Environment variables template
└── package.json           # Project dependencies
```

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run tests
- `yarn test:coverage` - Run tests with coverage
- `yarn lint` - Lint code
- `yarn migration` - Run database migrations

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/reset-password` - Request password reset
- `POST /auth/reset-password/:token` - Reset password with token

### User Management
- `GET /users/me` - Get current user profile

### Admin Routes
- `GET /admin/users` - List all users (admin only)
- `POST /admin/users` - Create a new user without password (admin only)

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `PORT` - Server port (default: 3000)
- `MONGODB_ADDON_URI` - MongoDB connection string
- `MONGODB_ADDON_DB` - MongoDB database name
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_SECRET_RESET` - Secret for password reset tokens
- `BREVO_API_KEY` - Brevo API key for emails

## Testing

Run the test suite:

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test:watch
```

Generate coverage report:

```bash
yarn test:coverage
```

## Docker Support

The project includes a Docker Compose setup for MongoDB:

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Extending the Scaffolding

### Adding New Modules

1. Create a new directory under `src/` for your module
2. Follow the same structure as the `auth` module:
   - `controller/` - HTTP request handlers
   - `service/` - Business logic
   - `model/` - Database models
   - `routes/` - Express routes
   - `dto/` - Type definitions

3. Import and register routes in `server.ts`

### Adding Email Templates

1. Create new template in Brevo dashboard
2. Add template ID to `app.config.ts`
3. Create helper function in `brevo.service.ts`

### Database Migrations

Create new migrations:

```bash
# Create a new migration file
touch src/migrations/$(date +%s)_YourMigrationName.ts
```

Follow the existing migration pattern for structure.

## Security Considerations

- Always use HTTPS in production
- Keep dependencies updated
- Use strong JWT secrets
- Configure CORS appropriately for your frontend
- Enable rate limiting for production
- Regular security audits

## License

This project is licensed under the ISC License.