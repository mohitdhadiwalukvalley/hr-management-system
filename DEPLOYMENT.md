# Deployment Guide

This guide explains how to deploy the HR Management System to a production environment.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- A hosting platform (e.g., Render, Railway, Heroku, VPS)

## Backend Configuration

### 1. Environment Variables

Copy the example environment file and update it:

```bash
cd server
cp .env.example .env
```

### 2. Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | production |
| MONGODB_URI | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/hr_management |
| JWT_SECRET | Secret for JWT tokens | (generate a secure random string) |
| JWT_REFRESH_SECRET | Secret for refresh tokens | (generate a secure random string) |
| FRONTEND_URL | Your frontend URL | https://your-frontend.com |
| PRODUCTION_FRONTEND_URL | Production frontend URL | https://your-frontend.com |

### 3. Generate Secure JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice to generate both `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Frontend Configuration

### 1. Environment Variables

Copy the example environment file and update it:

```bash
cd client
cp .env.example .env
```

### 2. Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://your-backend.com/api |

## Deployment Steps

### Option 1: Deploy to Render (Recommended for beginners)

#### Backend:
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `server`
4. Set the build command: `npm install`
5. Set the start command: `npm start`
6. Add environment variables from `.env`
7. Deploy

#### Frontend:
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the root directory to `client`
4. Set the build command: `npm install && npm run build`
5. Set the publish directory: `dist`
6. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
7. Deploy

### Option 2: Deploy to VPS (Digital Ocean, Linode, etc.)

1. SSH into your server
2. Clone the repository
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. Configure environment files
5. Build the frontend:
   ```bash
   cd client && npm run build
   ```
6. Use PM2 to run the backend:
   ```bash
   npm install -g pm2
   cd server
   pm2 start npm --name "hr-backend" -- start
   ```
7. Configure Nginx to serve the frontend and proxy API requests

### Option 3: Deploy to Railway

1. Create a new project on Railway
2. Deploy backend:
   - Set root directory to `server`
   - Add environment variables
3. Deploy frontend:
   - Set root directory to `client`
   - Set `VITE_API_URL` environment variable
   - Set build command: `npm run build`
   - Set output directory: `dist`

## MongoDB Atlas Setup

1. Create a free cluster at mongodb.com
2. Create a database user
3. Whitelist your server's IP address (or use 0.0.0.0/0 for all)
4. Get the connection string and add it to `MONGODB_URI`

## Troubleshooting

### Login Issues

If login fails in production:

1. **Check CORS**: Ensure `FRONTEND_URL` matches your frontend URL exactly
2. **Check Database**: Verify MongoDB connection is working
3. **Check JWT**: Ensure JWT secrets are set correctly
4. **Check Logs**: View server logs for error messages

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist includes your server IP
2. Check if connection string has correct credentials
3. Ensure network access is configured in MongoDB Atlas

### API Connection Issues

1. Verify `VITE_API_URL` points to correct backend URL
2. Check CORS configuration allows your frontend domain
3. Ensure backend is running and accessible

## Production Checklist

- [ ] Change JWT secrets to secure random values
- [ ] Update FRONTEND_URL to production frontend URL
- [ ] Update VITE_API_URL to production backend URL
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Enable HTTPS on your domains
- [ ] Set NODE_ENV=production
- [ ] Configure rate limiting if needed
- [ ] Set up monitoring and logging