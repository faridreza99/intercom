# Render Deployment Instructions

## Quick Setup

1. **Upload this folder** to your GitHub repository
2. **Create a new Web Service** on Render
3. **Connect your GitHub repo** to Render
4. **Configure the following settings:**

### Build & Deploy Settings
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18 or higher

### Environment Variables
Set these in Render's Environment Variables section:

```
DATABASE_URL=your_postgresql_database_url
INTERCOM_TOKEN=your_intercom_access_token
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_PORT=587
SMTP_SECURE=false
BUSINESS_NAME=Your Business Name
TRUSTPILOT_DOMAIN=yourbusiness.trustpilot.com
NODE_ENV=production
```

### Database Setup (if using PostgreSQL)
1. Create a PostgreSQL database in Render
2. Copy the DATABASE_URL to your environment variables
3. Run database migrations if needed

### Webhook Configuration
After deployment, update your Intercom webhook URL to:
`https://your-app-name.onrender.com/api/notifications/intercom`

## Migration Notes

✅ **Removed Replit-specific dependencies**
✅ **Cleaned vite.config.ts**
✅ **Added Node.js version requirement**
✅ **Optimized for Render deployment**

Your webhook should work reliably on Render without IP allowlisting issues.