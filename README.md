# Kapul Reader

AI-powered reading and learning app. Select any text to get instant explanations.

## Features
- Document reader (PDF and EPUB support)
- AI explanations (powered by Claude)
- Step-by-step problem solving
- Quiz mode
- Flashcards

Built for the Kapul Reading Group.

---

## Deployment Guide (DigitalOcean)

### Prerequisites
- DigitalOcean account
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- Git installed locally

### Option 1: Deploy with Docker (Recommended)

#### Step 1: Create a DigitalOcean Droplet
1. Go to DigitalOcean and create a new Droplet
2. Choose **Docker** from the Marketplace (Ubuntu + Docker pre-installed)
3. Select a size (Basic $6/month is sufficient)
4. Choose a datacenter region close to your users
5. Add your SSH key for access
6. Create the droplet

#### Step 2: Connect and Deploy
```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Clone the repository
git clone https://github.com/MikeBasse/kapul-reader-v10.git
cd kapul-reader-v10/kapul-reader-deploy

# Create the .env file with your API key
echo "ANTHROPIC_API_KEY=your-actual-api-key-here" > .env

# Build and run with Docker Compose
docker compose up -d --build
```

The app will be available at `http://YOUR_DROPLET_IP:3001`

#### Step 3: Set Up Domain and HTTPS (Optional but Recommended)
```bash
# Install Nginx
apt update && apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx as reverse proxy
cat > /etc/nginx/sites-available/kapul-reader << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/kapul-reader /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com
```

### Option 2: Deploy with DigitalOcean App Platform

1. Push your code to GitHub (without the .env file)
2. Go to DigitalOcean App Platform
3. Connect your GitHub repository
4. Configure as a **Docker** app
5. Add environment variable: `ANTHROPIC_API_KEY` = your key
6. Deploy

---

## Local Development

### Prerequisites
- Node.js 18+ installed

### Setup
```bash
cd kapul-reader-deploy

# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the backend server (terminal 1)
cd server && node index.js

# Start the frontend dev server (terminal 2)
npm run dev
```

The app will be available at `http://localhost:3000` (API requests proxy to port 3001)

### Building for Production
```bash
npm run build
```

This creates the `dist` folder with optimized static files.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-3-5-haiku-20241022` | Claude model to use |
| `MAX_TOKENS` | No | `1024` | Max tokens per response |
| `PORT` | No | `3001` | Server port |

---

## Architecture

```
kapul-reader-deploy/
├── src/                  # React frontend source
├── dist/                 # Built frontend (generated)
├── server/               # Express backend proxy
│   └── index.js          # API proxy server
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Docker Compose config
└── .env                  # Environment variables (not in git)
```

The backend server proxies Claude API requests to keep your API key secure. The API key never reaches the browser.

---

## Updating

```bash
# SSH into your server
ssh root@YOUR_DROPLET_IP

# Pull latest changes
cd kapul-reader-v10/kapul-reader-deploy
git pull

# Rebuild and restart
docker compose up -d --build
```
