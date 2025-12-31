# Memo Store

A secure, cloud-synced memo and text storage application with end-to-end encryption. Organize your notes in folders, edit lines in real-time, and access them from any device.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

Memo Store is a full-stack application that allows users to:
- Create and manage folders to organize memos
- Create files within folders and add/edit lines of content
- Upload and download text files with optional password protection
- Sync data across multiple devices with secure authentication
- Access memos from anywhere with persistent cloud storage

---

## Architecture

```
                                    +------------------+
                                    |     Client       |
                                    |  (React + Vite)  |
                                    +--------+---------+
                                             |
                                             v
                                    +------------------+
                                    |      Nginx       |
                                    |  (Load Balancer) |
                                    +--------+---------+
                                             |
                  +--------------------------+--------------------------+
                  |                          |                          |
                  v                          v                          v
         +--------+--------+        +--------+--------+        +--------+--------+
         |    Backend 1    |        |    Backend 2    |        |    Backend 3    |
         |    (Express)    |        |    (Express)    |        |    (Express)    |
         +--------+--------+        +--------+--------+        +--------+--------+
                  |                          |                          |
                  +--------------------------+--------------------------+
                                             |
                              +--------------+--------------+
                              |                             |
                              v                             v
                     +--------+--------+           +--------+--------+
                     |   PostgreSQL    |           |  Shared Volume  |
                     |   (Database)    |           |   (File Store)  |
                     +-----------------+           +-----------------+

                              +------------------+
                              |    Monitoring    |
                              +------------------+
                              | Loki + Promtail  |
                              |     Grafana      |
                              +------------------+
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TanStack React Query | Server State Management |
| Zustand | Client State Management |
| Tailwind CSS | Styling |
| Radix UI | Accessible Components |
| CryptoJS | Client-side Encryption |
| React Router | Navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| Express 5 | API Framework |
| Prisma | ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| Bcrypt | Password Hashing |
| Multer | File Uploads |
| Nodemailer | Email Service |
| Node Cron | Scheduled Tasks |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Nginx | Reverse Proxy / Load Balancer |
| Grafana | Monitoring Dashboard |
| Loki | Log Aggregation |
| Promtail | Log Collection |

---

## Features

### Authentication
- User registration with email verification
- Secure login with JWT tokens (access + refresh)
- Password reset via email
- Session management with HTTP-only cookies

### Memo Management
- Create, rename, and delete folders
- Create, rename, and delete files within folders
- Add, edit, and delete individual lines in files
- Real-time sync across devices

### File Upload
- Upload text files via drag-and-drop or file picker
- Optional password protection for uploaded files
- Secure file download with authentication

### Infrastructure
- Horizontally scalable backend with multiple instances
- Shared volume storage for file persistence across instances
- Load balancing via Nginx upstream configuration
- Centralized logging with Loki and Grafana

---

## API Reference

### User Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/user/register` | Register new user | No |
| POST | `/user/login` | User login | No |
| GET | `/user/me` | Get current user | Yes |
| POST | `/user/forgot_password` | Request password reset | No |
| POST | `/user/change-password` | Change password | No |
| GET | `/user/logout` | Logout user | Yes |
| GET | `/user/download/:id` | Download app | No |

### Memo Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/memo/createFolder` | Create new folder | Yes |
| POST | `/memo/createFile` | Create file in folder | Yes |
| POST | `/memo/addLine` | Add line to file | Yes |
| GET | `/memo/getLines/:fileId` | Get all lines in file | Yes |
| GET | `/memo/folders` | List user folders | Yes |
| GET | `/memo/file_folder/:folderId` | Get files in folder | Yes |
| GET | `/memo/delete_folder/:folderId` | Delete folder | Yes |
| GET | `/memo/delete_file/:folderId/:fileId` | Delete file | Yes |
| GET | `/memo/delete_line/:fileId/:lineId` | Delete line | Yes |
| POST | `/memo/edit_line` | Edit existing line | Yes |
| POST | `/memo/edit_names` | Rename folder/file | Yes |
| POST | `/memo/upload-txt` | Upload text file | Optional |
| POST | `/memo/download` | Download file | No |
| GET | `/memo/get-files` | List uploaded files | No |

---

## Database Schema

```
+------------------+       +------------------+       +------------------+
|      User        |       |      Folder      |       |       File       |
+------------------+       +------------------+       +------------------+
| id (UUID)        |<----->| id (UUID)        |<----->| id (UUID)        |
| fullName         |       | name             |       | title            |
| email (unique)   |       | ownerId (FK)     |       | folderId (FK)    |
| password         |       | createdAt        |       | createdAt        |
| createdAt        |       | updatedAt        |       | updatedAt        |
| passwordChangedAt|       +------------------+       +------------------+
+------------------+                                          |
        |                                                     |
        |                                                     v
        |                                          +------------------+
        |                                          |    FileLine      |
        |                                          +------------------+
        |                                          | id (UUID)        |
        |                                          | content          |
        |                                          | fileId (FK)      |
        |                                          | createdAt        |
        |                                          | updatedAt        |
        |                                          +------------------+
        |
        v
+------------------+
|     Upload       |
+------------------+
| id (UUID)        |
| mimetype         |
| originalName     |
| path             |
| filename         |
| uploadedAt       |
| password         |
| isProtected      |
| uploaderId (FK)  |
| size             |
+------------------+
```

### Relationships
- **User** has many **Folders** (one-to-many)
- **User** has many **Uploads** (one-to-many)
- **Folder** has many **Files** (one-to-many, cascade delete)
- **File** has many **FileLines** (one-to-many, cascade delete)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm or yarn

### Backend Setup

```bash
cd Express

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd Memo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_BASE_URL to your backend URL

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/memo_store
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SMTP_HOST=smtp.example.com
SMTP_USER=your-email
SMTP_PASS=your-password
```

#### Frontend (.env)
```
VITE_BASE_URL=http://localhost:8000/api
```

---

## Docker Deployment

### Development

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This starts:
- Frontend on port 5173 (with hot reload)
- Backend on port 8000

### Production

```bash
docker-compose up --build -d
```

This deploys:
- Frontend served via Nginx on port 80
- 3 Backend instances (load balanced)
- Shared volume for file storage across all backend instances
- Loki for log aggregation (port 3100)
- Promtail for log collection
- Grafana dashboard (port 3000)

### Load Balancing

Nginx acts as a reverse proxy and load balancer, distributing requests across three backend instances:

```
upstream backend_cluster {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

### Shared Storage

All backend instances share a common Docker volume (`shared-data`) mounted at `/app/data`. This ensures:
- Uploaded files are accessible from any backend instance
- File consistency across horizontal scaling
- Persistent storage independent of container lifecycle

---

## Project Structure

```
MemoSaver/
+-- Express/                    # Backend API
|   +-- src/
|   |   +-- Controller/         # Request handlers
|   |   +-- Middleware/         # Auth, upload middleware
|   |   +-- Routes/             # API route definitions
|   |   +-- Utils/              # Helper functions
|   +-- prisma/                 # Database schema & migrations
|   +-- Dockerfile
|   +-- package.json
|
+-- Memo/                       # Frontend App
|   +-- src/
|   |   +-- components/         # UI components
|   |   +-- Comps/              # Feature components
|   |   +-- Pages/              # Route pages
|   |   +-- ZustandStore/       # State management
|   |   +-- lib/                # Utilities
|   +-- Dockerfile
|   +-- nginx.conf              # Production server config
|   +-- package.json
|
+-- docker-compose.yml          # Production deployment
+-- docker-compose.dev.yml      # Development deployment
+-- loki-config.yaml            # Log storage config
+-- promtail-config.yaml        # Log collector config
+-- README.md
```

---

## Scripts

### Backend
| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## License

MIT License

---

## Author

**Rajan Dhamala**

- GitHub: [@RajanDhamala](https://github.com/RajanDhamala)
