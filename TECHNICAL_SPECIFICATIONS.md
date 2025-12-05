# Gym Management System - Technical Specifications

## 📋 Project Overview

A comprehensive gym management system with biometric access control integration using ESSL K30 Pro fingerprint scanner. The system provides real-time monitoring, client management, package tracking, and automated door access control.

## 🏗️ System Architecture

### Frontend (React + Vite)
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.11
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: TanStack React Query 5.56.2
- **Routing**: React Router DOM 6.26.2
- **Real-time**: Socket.IO Client 4.8.1
- **Charts**: Recharts 2.12.7
- **Forms**: React Hook Form 7.53.0
- **Validation**: Zod 3.23.8

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18.2
- **Language**: TypeScript 5.3.3
- **Database**: MongoDB 8.0.0 (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Real-time**: Socket.IO 4.7.2
- **File Upload**: Multer 1.4.5
- **Scheduling**: node-cron 3.0.3
- **HTTP Client**: Axios 1.12.2
- **Security**: Helmet 7.1.0
- **CORS**: cors 2.8.5
- **Compression**: compression 1.7.4
- **Logging**: morgan 1.10.0

### Database (MongoDB)
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose 8.0.0
- **Collections**:
  - `clients` - Member information and access control
  - `accesslogs` - Biometric access attempts
  - `packages` - Subscription plans
  - `users` - Admin/staff accounts
  - `gymsettings` - Gym configuration

### Hardware Integration
- **Biometric Device**: ESSL K30 Pro
- **Communication**: HTTP API + Webhooks
- **Device Features**:
  - Fingerprint scanning
  - User registration
  - Time-based access control
  - Door control integration
  - Real-time webhook callbacks
- **Device IP**: 192.168.1.19

## 🚀 Deployment Architecture

### Frontend Deployment
- **Platform**: Vercel / Render
- **Build Command**: `npm run build`
- **Environment Variables**:
  - `VITE_API_URL` - Backend API URL
  - `VITE_WS_URL` - WebSocket URL

### Backend Deployment
- **Platform**: Render / Heroku
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGODB_URI` - Database connection string
  - `ESSL_DEVICE_IP` - ESSL device IP address (192.168.1.19)
  - `ESSL_DEVICE_PORT` - ESSL device port (default: 4370)
  - `ESSL_DEVICE_PASSWORD` - Device password
  - `FRONTEND_URL` - Frontend URL for CORS
  - `NODE_ENV` - Environment (development/production)

## 📊 Database Schema

### Client Model
```typescript
interface IClient {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  
  // Package Details
  packageType: string;
  packageStartDate: Date;
  packageEndDate: Date;
  packageAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'pending';
  
  // Access Control
  esslUserId: string;
  fingerprintEnrolled: boolean;
  accessSchedule: IAccessSchedule[];
  isAccessActive: boolean;
  lastAccessTime?: Date;
  accessAttempts: number;
  
  // Status
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  photo?: string;
}
```

### Access Log Model
```typescript
interface IAccessLog {
  clientId: ObjectId;
  esslUserId: string;
  timestamp: Date;
  accessGranted: boolean;
  reason: string;
  biometricType: 'fingerprint' | 'face';
  deviceIp?: string;
}
```

## 🔧 API Endpoints

### Client Management
- `POST /api/clients` - Create new client
- `GET /api/clients` - Get all clients (with filters)
- `GET /api/clients/:id` - Get client by ID
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats` - Get client statistics

### Biometric Access Control
- `GET /api/biometric/device/test` - Test ESSL device connection
- `POST /api/biometric/register` - Register client on device
- `POST /api/biometric/enroll` - Enroll fingerprint
- `PUT /api/biometric/schedule` - Update access schedule
- `PUT /api/biometric/toggle/:clientId` - Enable/disable access
- `DELETE /api/biometric/client/:clientId` - Remove from device
- `GET /api/biometric/logs` - Get all access logs
- `POST /api/biometric/webhook` - Device webhook endpoint

### Package Management
- `GET /api/packages` - Get all packages
- `POST /api/packages` - Create new package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Settings
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update profile
- `GET /api/settings/gym` - Get gym settings
- `PUT /api/settings/gym` - Update gym settings

## 🔄 Real-time Features

### WebSocket Events
- `access_attempt` - Real-time access log updates
- `fingerprint_enrolled` - Fingerprint enrollment notifications
- `system_notification` - General system notifications

### Background Jobs
- **Access Control Job**: Runs daily at 1 AM
  - Checks for expired packages
  - Disables access on device
  - Updates client status
  - Sends expiry notifications

- **Sync Scheduler**: Runs every 5 minutes
  - Syncs device logs with database
  - Updates access statistics
  - Checks device connectivity

## 🔐 Security Features

- **Authentication**: JWT-based authentication
- **Password Security**: bcryptjs hashing
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: express-validator
- **File Upload**: Secure file handling with multer

## 📱 Frontend Features

### Pages
- **Dashboard**: Analytics, KPIs, and business growth charts
- **All Clients**: Complete client management
- **Active Clients**: Active members only
- **Inactive Clients**: Inactive/expired members
- **Add Client**: New member registration
- **Packages**: Subscription plan management
- **Billing**: Payment processing
- **Biometric Access**: Fingerprint enrollment and access control
- **Profile**: User profile management

### Components
- **GymSidebar**: Navigation component
- **KPICard**: Key performance indicators
- **GymTable**: Data tables with filtering
- **PageHeader**: Consistent page headers
- **UI Components**: shadcn/ui component library

## 🎨 UI/UX Features

- **Design System**: Modern UI with Tailwind CSS
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Theme switching capability
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: ARIA-compliant components
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🔧 Development Tools

### Frontend
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Vite**: Fast development server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

### Backend
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **tsx**: TypeScript execution
- **nodemon**: Development auto-restart
- **Jest**: Testing framework

## 📦 Package Versions

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "@tanstack/react-query": "^5.56.2",
  "axios": "^1.12.2",
  "socket.io-client": "^4.8.1",
  "recharts": "^2.12.7",
  "react-hook-form": "^7.53.0",
  "zod": "^3.23.8",
  "tailwindcss": "^3.4.11",
  "vite": "^5.4.1"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "socket.io": "^4.7.2",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "axios": "^1.12.2",
  "node-cron": "^3.0.3",
  "multer": "^1.4.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "morgan": "^1.10.0"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5+
- ESSL K30 Pro device (optional for development)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start development servers:
   - Frontend: `npm run dev:frontend`
   - Backend: `npm run dev:backend`

### Environment Setup
```bash
# Backend .env
MONGODB_URI=mongodb://localhost:27017/gym_management
ESSL_DEVICE_IP=192.168.1.19
ESSL_DEVICE_PORT=4370
ESSL_DEVICE_PASSWORD=0
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Frontend .env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: React Query for API response caching
- **Compression**: Gzip compression for API responses
- **Image Optimization**: Optimized image handling
- **Code Splitting**: Lazy loading for better performance
- **Bundle Optimization**: Vite's optimized build process

## 🔍 Monitoring & Logging

- **Access Logs**: Complete biometric access tracking
- **Error Logging**: Comprehensive error handling
- **Performance Monitoring**: Request/response timing
- **Real-time Updates**: WebSocket-based notifications
- **Device Status**: ESSL device connectivity monitoring

## 🛠️ Maintenance & Updates

- **Automated Jobs**: Background processes for maintenance
- **Data Sync**: Regular synchronization with ESSL device
- **Backup Strategy**: Database backup recommendations
- **Update Process**: Version management and deployment
- **Monitoring**: System health checks and alerts

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Gym Management Team
