# Eiffage Backend API - Postman Collection

This directory contains a comprehensive Postman collection for testing all endpoints of the Eiffage Backend API.

## Files Included

1. **Eiffage_Backend_API.postman_collection.json** - Main collection with all API endpoints
2. **Eiffage_Backend_Development.postman_environment.json** - Development environment variables
3. **Eiffage_Backend_Production.postman_environment.json** - Production environment variables

## How to Import

### Import Collection
1. Open Postman
2. Click "Import" button
3. Select `Eiffage_Backend_API.postman_collection.json`
4. Click "Import"

### Import Environments
1. In Postman, click "Import" button
2. Select both environment files:
   - `Eiffage_Backend_Development.postman_environment.json`
   - `Eiffage_Backend_Production.postman_environment.json`
3. Click "Import"

## Setup

1. **Select Environment**: Choose either "Eiffage Backend - Development" or "Eiffage Backend - Production" from the environment dropdown in the top right
2. **Update Base URL**: If needed, update the `baseUrl` variable in your selected environment
3. **Authentication**: The collection includes automatic token management

## Usage

### Authentication Flow
1. **Register a User**: Use "Register User" endpoint to create a new account
2. **Login**: Use "Login User" endpoint - this will automatically set the `accessToken` and `refreshToken` variables
3. **Protected Endpoints**: All protected endpoints will automatically use the stored access token

### Automatic Token Management
- The "Login User" and "Refresh Access Token" requests include post-request scripts that automatically store tokens
- No manual token copying required!

## API Endpoints Overview

### Authentication (`/auth`)
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/reset-password-token` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/users` - Create user without password (Admin only)

### User Management (`/users`)
- `GET /users/me` - Get current user profile (requires authentication)

### Admin User Management (`/admin/users`)
- `GET /admin/users` - Get all users (Admin only)
- `POST /admin/users` - Create user without password (Admin only)

### Skills Management (`/api`)

#### MacroSkillTypes
- `GET /api/macro-skill-types` - Get all macro skill types
- `GET /api/macro-skill-types/:id` - Get macro skill type by ID
- `POST /api/macro-skill-types` - Create new macro skill type

#### MacroSkills
- `GET /api/macro-skills` - Get all macro skills
- `GET /api/macro-skills/:id` - Get macro skill by ID
- `POST /api/macro-skills` - Create new macro skill

#### Skills
- `GET /api/skills` - Get all skills
- `GET /api/skills/:id` - Get skill by ID
- `POST /api/skills` - Create new skill

## Request Body Examples

### User Registration
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### User Login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Create MacroSkillType
```json
{
  "name": "Technical Skills"
}
```

### Create MacroSkill
```json
{
  "name": "Programming Languages",
  "macroSkillTypeId": "macro-skill-type-id"
}
```

### Create Skill
```json
{
  "name": "JavaScript",
  "expectedLevel": "Advanced",
  "macroSkillId": "macro-skill-id"
}
```

## Testing Tips

1. **Start with Authentication**: Always begin by registering and logging in a user
2. **Admin Endpoints**: To test admin endpoints, ensure your user has ADMIN role
3. **Skills Hierarchy**: Create MacroSkillTypes first, then MacroSkills, then Skills
4. **Environment Variables**: Use the environment variables for IDs to make testing easier

## Troubleshooting

- **401 Unauthorized**: Your access token may have expired. Use the "Refresh Access Token" endpoint
- **403 Forbidden**: You may not have the required role (USER/ADMIN) for the endpoint
- **400 Bad Request**: Check that your request body matches the expected schema

## Environment Variables

The collection uses the following variables:
- `baseUrl` - Base URL of the API
- `accessToken` - JWT access token (automatically managed)
- `refreshToken` - JWT refresh token (automatically managed)

You can add additional variables as needed for your testing workflow.
