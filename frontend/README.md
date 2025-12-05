# Frontend - Gym Management System

Modern React frontend for gym management with biometric integration.

## Features

- 🎨 Modern UI with Tailwind CSS + shadcn/ui
- 📊 Dashboard with KPIs and Analytics
- 👥 Client Management
- 📦 Package Management
- 👆 Biometric Enrollment Interface
- 🔌 Real-time Updates via WebSocket
- 📱 Responsive Design

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui Components
- React Router
- Axios (API calls)
- Socket.IO Client (WebSocket)
- Recharts (Charts)

## Setup

### 1. Install Dependencies

From the root directory:
```bash
npm install
```

Or from frontend directory:
```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### 3. Run Development Server

From root:
```bash
npm run dev:frontend
```

Or from frontend directory:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── GymSidebar.tsx
│   │   ├── GymTable.tsx
│   │   ├── KPICard.tsx
│   │   └── ...
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── AddClient.tsx
│   │   ├── AllClients.tsx
│   │   ├── Packages.tsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   │   ├── api.ts     # API client
│   │   ├── socket.ts  # WebSocket client
│   │   └── utils.ts   # Helper functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## API Integration

The frontend communicates with the backend API:

```typescript
import { clientAPI } from '@/lib/api';

// Get all clients
const response = await clientAPI.getAll();

// Create client
await clientAPI.create(clientData);
```

## WebSocket Integration

Real-time updates for access logs:

```typescript
import { initSocket } from '@/lib/socket';

const socket = initSocket();

socket.on('access-log', (data) => {
  console.log('New access attempt:', data);
  // Update UI
});
```

## Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/GymSidebar.tsx`

## Styling

This project uses:
- Tailwind CSS for utility classes
- shadcn/ui for pre-built components
- Custom CSS in component files when needed

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
