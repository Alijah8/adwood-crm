# Adwood CRM - Deployment Guide

## Quick Start (Local Development)

```bash
cd adwood-crm
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Deploy to Railway

### Option 1: GitHub Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   cd adwood-crm
   git init
   git add .
   git commit -m "Initial commit - Adwood CRM"
   git remote add origin https://github.com/YOUR-USERNAME/adwood-crm.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `adwood-crm` repository
   - Railway will auto-detect Vite and deploy

3. **Environment Variables** (if needed)
   - No environment variables required for the base CRM
   - Add any API keys for integrations in Railway's Variables tab

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
cd adwood-crm
railway init
railway up
```

---

## Build Configuration

The project uses Vite with the following build settings:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+ (recommended)

### Railway Settings

If auto-detection fails, use these settings:
- **Builder**: Nixpacks
- **Build Command**: `npm run build`
- **Start Command**: `npx serve dist -s`

You may need to add `serve` as a dependency:
```bash
npm install serve
```

---

## Features Included

- **Dashboard**: Metrics, charts, and quick overview
- **Contacts**: Full CRUD with filtering and search
- **Deals**: Kanban-style pipeline management
- **Calendar**: Event scheduling and management
- **Communications**: Email/SMS/Call logging
- **Campaigns**: Marketing campaign management
- **Payments**: Invoice and payment tracking
- **Reports**: Analytics and data visualization
- **Staff**: Team management
- **Settings**: App configuration and data export

---

## Data Storage

The CRM uses browser localStorage for data persistence. This means:
- Data persists across browser sessions
- Data is stored locally on each user's browser
- Export/import functionality available in Settings

For production use with multi-user support, you'll want to:
1. Add a backend API (Node.js, Python, etc.)
2. Connect to a database (PostgreSQL, MongoDB)
3. Implement user authentication

---

## Customization

### Theming
Edit `src/index.css` to modify CSS variables:
- `--primary`: Main brand color
- `--background`: Page background
- `--card`: Card backgrounds
- `--border`: Border colors

### Adding Pages
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/Sidebar.tsx`

---

## Support

For issues or questions:
- Check the browser console for errors
- Export data before making major changes
- Use the Settings page to reset data if needed
