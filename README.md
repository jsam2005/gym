# M★S Fitness Studio - Admin Dashboard

A modern, responsive admin dashboard for managing fitness studio operations built with React, TypeScript, and Tailwind CSS.

## 🏋️ Features

- **Dashboard Overview** - Real-time KPIs and analytics
- **Client Management** - Add, view, and manage all clients
- **Package Management** - Create and manage fitness packages with timing slots
- **Billing System** - Track payments and outstanding amounts
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Modern UI** - Clean interface with shadcn/ui components

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd strengthscape-admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:8080`

## 📜 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── GymSidebar.tsx  # Navigation sidebar
│   ├── KPICard.tsx     # Dashboard metrics cards
│   └── PageHeader.tsx  # Page header component
├── pages/              # Application pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── AllClients.tsx  # Client management
│   ├── AddClient.tsx   # Add new client form
│   ├── Packages.tsx    # Package management
│   └── Billing.tsx     # Billing system
├── lib/                # Utility functions
└── App.tsx            # Main application component
```

## 🎨 Key Features

### Dashboard
- Real-time client statistics
- Revenue tracking
- Interactive charts
- Quick action buttons

### Client Management
- Add new clients with personal details
- Track active/inactive clients
- Manage client packages and timings
- Search and filter functionality

### Package Management
- Create fitness packages
- Set duration (1-24 months)
- Define timing slots:
  - Morning (6:00 AM - 10:00 AM)
  - Afternoon (12:00 PM - 4:00 PM)
  - Evening (5:00 PM - 9:00 PM)
  - Night (8:00 PM - 11:00 PM)

### Billing System
- Track payments and dues
- Generate billing reports
- Monitor revenue trends

## 🎯 Usage

1. **Dashboard**: View overall studio metrics and quick stats
2. **Add Client**: Use the form to register new members
3. **Manage Clients**: View, edit, and track all client information
4. **Packages**: Create and manage different membership packages
5. **Billing**: Handle payments and track financial data

## 🔧 Configuration

The app uses Vite configuration in `vite.config.ts`:
- Development server runs on port 8080
- Path aliases configured for clean imports
- React SWC for fast compilation

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent component design
- **Custom CSS** for specific gym-themed styling
- **Responsive design** with mobile-first approach

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting service
```

## 🌐 Custom Domain

To connect a custom domain:
1. Navigate to Project > Settings > Domains in Lovable
2. Click "Connect Domain"
3. Follow the setup instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
"# gym" 
