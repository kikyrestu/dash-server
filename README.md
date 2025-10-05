<<<<<<< HEAD
# 🚀 Welcome to Z.ai Code Scaffold

A modern, production-ready web application scaffold powered by cutting-edge technologies, designed to accelerate your development with [Z.ai](https://chat.z.ai)'s AI-powered coding assistance.

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 🤖 Powered by Z.ai

This scaffold is optimized for use with [Z.ai](https://chat.z.ai) - your AI assistant for:

- **💻 Code Generation** - Generate components, pages, and features instantly
- **🎨 UI Development** - Create beautiful interfaces with AI assistance  
- **🔧 Bug Fixing** - Identify and resolve issues with intelligent suggestions
- **📝 Documentation** - Auto-generate comprehensive documentation
- **🚀 Optimization** - Performance improvements and best practices

Ready to build something amazing? Start chatting with Z.ai at [chat.z.ai](https://chat.z.ai) and experience the future of AI-powered development!

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

## 🤝 Get Started with Z.ai

1. **Clone this scaffold** to jumpstart your project
2. **Visit [chat.z.ai](https://chat.z.ai)** to access your AI coding assistant
3. **Start building** with intelligent code generation and assistance
4. **Deploy with confidence** using the production-ready setup

---

Built with ❤️ for the developer community. Supercharged by [Z.ai](https://chat.z.ai) 🚀
=======
# Server Dashboard 🖥️

Dashboard monitoring real-time yang modern untuk server rumah Anda. Dibangun dengan React, Node.js, dan WebSockets untuk update langsung.

## ✨ Fitur Unggulan

### 🔐 Sistem Autentikasi PAM
- **PAM Authentication**: Login menggunakan kredensial sistem/OS Anda (seperti webmin/webadmin)
- **Dual Authentication**: Mendukung autentikasi sistem dan kredensial dashboard tradisional
- **Automatic Fallback**: Secara otomatis beralih ke autentikasi tradisional jika auth sistem gagal
- **Enhanced Security**: Token JWT dengan pelacakan sumber autentikasi

### 📊 Monitoring & Management
- **📊 Monitoring Real-time** dengan metrics sistem lengkap:
  - CPU usage dan load average
  - Memory (RAM) usage  
  - Disk space dan usage
  - Network I/O (upload/download)
  - System temperature (jika tersedia)
  - System uptime
  - Top processes dengan resource usage
- **💻 Terminal Terintegrasi** untuk eksekusi command langsung dari dashboard
- **📁 File Manager** untuk browse file sistem dengan security restrictions
- **🗄️ Database Manager** untuk MySQL, PostgreSQL, MongoDB, SQLite, dan Redis
- **🔍 Log Viewer** untuk monitoring system dan application logs
- **🌐 Network Status** untuk tracking koneksi dan port network
- **🛡️ Security Center** untuk monitoring keamanan sistem
- **⚙️ Web Services Monitor** untuk mengelola layanan web
- **💾 Storage Manager** untuk analisis penggunaan disk

### 🎨 Interface & Experience
- **🎨 UI Modern** dengan sidebar navigation dan design yang clean
- **📱 Responsive Design** dengan custom components tanpa library external
- **🔌 WebSocket Connection** untuk live data updates
- **🔄 Auto-reconnection** dan status indicators
- **📅 Tanggal & Waktu Indonesia** dengan format yang friendly
- **📈 Charts & Visualisasi** yang indah dengan SVG dan progress bars
- **🔒 Security Features** dengan command restrictions dan path sanitization

## 🗂️ Struktur Project

```
server-dash/
├── backend/          # Node.js Express server dengan WebSocket
├── agent/            # System monitoring data collection
├── frontend/         # React dashboard interface dengan sidebar
├── package.json      # Root package dengan convenience scripts
└── start-*.sh        # Individual component start scripts
```

## 🚀 **Quick Start**

1. **Install dependencies untuk semua komponen:**
   ```bash
   npm run install-all
   ```

2. **Start semua komponen sekaligus:**
   ```bash
   # Menggunakan script all-in-one (RECOMMENDED)
   ./start-all.sh
   
   # Atau install concurrently dan gunakan npm script:
   npm install
   npm run dev
   ```

3. **Stop semua services:**
   ```bash
   ./stop-all.sh
   # atau tekan Ctrl+C di terminal start-all.sh
   ```

4. **Akses dashboard:** `http://localhost:3000`

## 🔐 **Autentikasi PAM**

Dashboard ini terintegrasi dengan sistem PAM (Pluggable Authentication Modules) server Anda, memungkinkan:

### Mode Autentikasi

1. **System Auto** (Default): 
   - Login menggunakan username/password sistem operasi Anda
   - Tidak perlu membuat akun dashboard terpisah
   - Integrasi seamless dengan manajemen user sistem
   - Fallback otomatis ke autentikasi dashboard jika auth sistem gagal

2. **Dashboard**: 
   - Menggunakan kredensial dashboard tradisional
   - Default: `admin` / `admin123`

### Keamanan Enhanced
- Validasi password melalui sistem PAM
- JWT tokens dengan tracking sumber autentikasi
- Proteksi timeout untuk operasi sistem
- Role-based access control
- Security operations dengan path traversal protection

### Penggunaan
1. Buka dashboard di browser
2. Pilih mode autentikasi:
   - **System Auto**: Gunakan username/password OS Anda
   - **Dashboard**: Gunakan kredensial dashboard
3. Login dan akses semua fitur dashboard

**Catatan**: Autentikasi PAM memerlukan permission sistem yang sesuai. Pastikan aplikasi memiliki hak akses yang diperlukan untuk validasi kredensial sistem.

## 🔧 **Manual Setup (Optional)**

Jika ingin menjalankan secara individual:

```bash
# Terminal 1: Backend server (port 3001)
./start-backend.sh

# Terminal 2: Data collection agent  
./start-agent.sh

# Terminal 3: React frontend (port 3000)
./start-frontend.sh
```

## Manual Setup

### 1. Backend Server

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:3001` and provide:
- REST API endpoints for current metrics
- WebSocket server for real-time updates
- CORS enabled for frontend communication

### 2. Data Collection Agent

```bash
cd agent
npm install
npm start
```

The agent collects system metrics every 2 seconds and sends them to the backend server.

### 3. Frontend Dashboard

```bash
cd frontend
npm install
npm start
```

The React frontend will start on `http://localhost:3000` and automatically connect to the backend WebSocket.

## Configuration

### Backend (server.js)
- **Port**: 3001 (configurable via PORT environment variable)
- **WebSocket**: Enabled on same port as HTTP server
- **Data retention**: Last 100 data points kept in memory
- **CORS**: Enabled for frontend access

### Agent (collect.js)
- **Update interval**: 2 seconds
- **Backend URL**: http://localhost:3001
- **Retry logic**: Automatic retry on connection failures
- **Metrics collected**: CPU, memory, disk, network, temperature, uptime, processes

### Frontend
- **WebSocket URL**: ws://localhost:3001
- **Auto-reconnection**: 3-second intervals on disconnect
- **Responsive breakpoints**: Mobile, tablet, desktop layouts
- **Chart history**: Last 50 data points displayed

## System Requirements

- **Node.js**: v14 or higher
- **Operating System**: Linux/macOS (for system monitoring commands)
- **RAM**: Minimal requirements (~50MB for all components)
- **Browser**: Modern browser with WebSocket support

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 3001 are available
2. **Permission errors**: Some system metrics may require elevated permissions
3. **Connection failed**: Check if backend server is running before starting agent/frontend
4. **Missing data**: Verify that system monitoring commands (ps, df, free, etc.) are available

### Logs

- Backend: Console output shows client connections and data flow
- Agent: Console output shows metric collection and API calls
- Frontend: Browser console shows WebSocket connection status

## Development

### Adding New Metrics

1. **Backend**: Add new data fields to the metrics object in `server.js`
2. **Agent**: Add collection logic for new metrics in `collect.js`
3. **Frontend**: Create new components or update existing ones to display the data

### Customizing UI

All frontend components are custom-built without external UI libraries:
- `MetricCard`: Display individual metrics with progress bars
- `LineChart`: SVG-based real-time charts
- `ProcessList`: Sortable table for process information
- `ConnectionStatus`: WebSocket connection indicator
- `Dashboard`: Main layout and data orchestration

## License

ISC License
>>>>>>> ab2afdd2ff045b8f947a21b8bfdb7ef93685f184
