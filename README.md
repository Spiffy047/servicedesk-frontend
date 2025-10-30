# HOTFIX ServiceDesk Platform

Complete HOTFIX ServiceDesk solution with React frontend and Flask backend, featuring role-based dashboards, real-time chat, comprehensive analytics, and intelligent auto-assignment.

## Live Demo

- **Frontend**: https://hotfix-ochre.vercel.app
- **Backend API**: https://hotfix.onrender.com
- **Swagger api doc** - https://hotfix.onrender.com/api/docs/

## Project Structure

```
hotfix/
├── servicedesk-backend/     # Flask REST API backend
└── servicedesk-frontend/    # React frontend application
```

## Technology Stack

### Frontend
- **React 18** with JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **React Hook Form** - Form validation
- **Recharts** - Data visualization
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Production database
- **Flask-RESTful** - REST API framework
- **Cloudinary** - Image/file storage
- **Gunicorn** - WSGI server
- **JWT Authentication** - Secure token-based auth

## Key Features

### Intelligent Auto-Assignment System
- **Workload-based assignment** - Automatically assigns tickets to agents with least active workload
- **Live database integration** - Uses real agent data from PostgreSQL
- **Role-based filtering** - Only assigns to Technical Users and Technical Supervisors
- **Smart notifications** - Creates alerts for assigned agents and supervisors

### Advanced File Upload System
- **Multi-endpoint support** - Handles both ticket creation and timeline uploads
- **Cloudinary integration** - Secure cloud storage with automatic optimization
- **Timeline integration** - File uploads appear immediately in ticket timeline
- **Multiple format support** - Images, documents, PDFs, and more

### Dynamic Configuration System
- **Database-driven configuration** - No hardcoded values
- **Flexible SLA management** - Configurable targets per priority
- **Dynamic user roles** - Customizable permissions
- **Configurable workflows** - Adaptable status transitions

### Role-Based Dashboards
- **Normal User**: Personal ticket management with file attachments
- **Technical User**: Agent portal with SLA monitoring and workload tracking
- **Technical Supervisor**: Team analytics and performance oversight
- **System Admin**: Complete system management and user administration

### Interactive Components
- Real-time ticket chat with timeline view
- File upload and display with Cloudinary integration
- Responsive data tables with pagination
- Interactive charts and analytics
- Toast notifications and clickable alerts
- Agent name resolution in ticket displays

### Analytics & Reporting
- SLA adherence tracking with real-time calculations
- Ticket aging analysis with priority-based metrics
- Agent performance scorecards with workload balancing
- Real-time dashboard updates with live database queries

## Quick Start

### Frontend Development
```bash
cd servicedesk-frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend Development
```bash
cd servicedesk-backend
pip install -r requirements.txt
python app.py
# Runs at http://localhost:5001
```

## Environment Variables

⚠️ **Security Note**: Never commit `.env` files to version control. Use `.env.example` as template.

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:5001/api
```

### Backend (.env)
```bash
# Copy from .env.example and fill with your values
DATABASE_URL=postgresql://user:pass@host:port/dbname
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET_KEY=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_key
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-hook-form": "^7.43.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-select": "^1.2.0",
    "recharts": "^2.5.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.0",
    "tailwindcss": "^3.2.7",
    "postcss": "^8.4.21",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.38.0"
  }
}
```

## Component Structure

```
src/
├── components/
│   ├── analytics/          # Charts and analytics components
│   ├── auth/              # Authentication components
│   ├── common/            # Reusable UI components
│   ├── dashboards/        # Role-specific dashboards
│   ├── forms/             # Form components
│   ├── notifications/     # Notification system
│   └── tickets/           # Ticket management components
├── App.jsx               # Main application component
├── main.jsx             # Application entry point
└── index.css           # Global styles
```

### Key Components

#### Dashboards
- `NormalUserDashboard.jsx` - Personal ticket view
- `TechnicalUserDashboard.jsx` - Agent portal with SLA alerts
- `TechnicalSupervisorDashboard.jsx` - Team management and analytics
- `SystemAdminDashboard.jsx` - System administration

#### Shared Components
- `TicketDetailDialog.jsx` - Comprehensive ticket view with chat
- `DataModal.jsx` - Reusable data display modal
- `Pagination.jsx` - List navigation component
- `NotificationBell.jsx` - Real-time notifications

#### Analytics
- `SLAAdherenceCard.jsx` - SLA tracking display
- `TicketAgingAnalysis.jsx` - Aging analysis charts
- `AgentPerformanceScorecard.jsx` - Performance metrics

## User Roles & Features

### Normal User
- View and create personal tickets
- Real-time chat with support agents
- Track ticket status and resolution
- Upload images and files

### Technical User
- Manage assigned tickets
- SLA violation alerts with "Take Action" functionality
- Update ticket status (Pending, Resolved)
- Access to all tickets for assignment

### Technical Supervisor
- Team analytics and performance metrics
- Ticket aging analysis
- Agent workload management
- SLA adherence monitoring

### System Admin
- Complete user management (CRUD)
- System health monitoring
- Advanced analytics dashboard
- User role assignment

## Authentication & Security

- JWT token-based authentication
- Role-based access control (RBAC)
- Protected routes based on user roles
- Secure API communication with CORS
- Form validation with React Hook Form

## Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive breakpoints for all screen sizes
- Touch-friendly interactions
- Accessible navigation and components

## Build & Deployment

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production (Vercel)
```bash
# Build and deploy
npm run build
# Deploy dist/ folder to Vercel

# Or connect GitHub repository for auto-deployment
```

## Styling & Theming

### Tailwind CSS Configuration
- Custom color palette for branding
- Responsive utilities for all components
- Dark mode ready (can be implemented)
- Consistent spacing and typography

### Component Styling
- Utility-first approach with Tailwind
- Consistent design system
- Accessible color contrasts
- Professional UI/UX patterns

## State Management

- React hooks for local state
- Context API for global state (if needed)
- Form state with React Hook Form
- API state management with fetch

## Development Workflow

1. **Component Development**
   - Create reusable components in appropriate directories
   - Use TypeScript for type safety
   - Follow React best practices

2. **Styling**
   - Use Tailwind CSS utilities
   - Maintain consistent design patterns
   - Ensure responsive behavior

3. **Integration**
   - Connect to backend API endpoints
   - Handle loading and error states
   - Implement proper data validation

## Performance Optimizations

- Code splitting with React.lazy (ready for implementation)
- Image optimization via Cloudinary
- Efficient re-renders with React.memo
- Optimized bundle size with Vite

## Recent Enhancements

### Intelligent Auto-Assignment (Latest)
- **Smart workload balancing** - Automatically assigns tickets to agents with least active tickets
- **Live database queries** - Uses real-time agent availability from PostgreSQL
- **Enhanced notifications** - Creates assignment alerts and supervisor escalations
- **Agent name resolution** - Displays actual agent names instead of IDs

### Advanced File Upload System (Latest)
- **Dual endpoint support** - `/api/files/upload` and `/api/upload/image` for different use cases
- **Enhanced field detection** - Automatically detects files in multiple form field names
- **Timeline integration** - File uploads appear immediately in ticket conversation
- **Improved error handling** - Better debugging and user feedback

## Configuration Management

The system uses a dynamic, database-driven configuration system:

- **No hardcoded values** - All settings stored in database
- **Flexible SLA targets** - Configurable per priority level
- **Dynamic user roles** - Customizable permissions and access levels
- **Environment-based settings** - Separate configurations for development and productionaccess
- **Configurable categories** - Adaptable ticket classification
- **System settings** - Runtime configuration without code changes

### Key API Endpoints
```bash
# Auto-assignment and agents
GET /api/agents/assignable          # Get available agents
GET /api/analytics/agent-workload   # Agent workload data

# File uploads
POST /api/files/upload             # Timeline file uploads
POST /api/upload/image             # Image uploads

# Configuration
GET /api/config/priorities         # SLA targets
GET /api/config/roles             # User roles
POST /api/config/initialize       # Setup defaults
```

## Database Setup

The system automatically initializes configuration tables on startup. For manual setup:

```bash
cd it-servicedesk-backend
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

## Future Enhancements

- Progressive Web App (PWA) features
- Real-time updates with WebSockets
- Advanced search and filtering
- Offline capabilities
- Push notifications
- Configuration versioning and rollback

## License

MIT License - see LICENSE file for details.