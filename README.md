# HR Management System

A production-ready, role-based HR management platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### Phase 1: Authentication & Setup ✅
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, HR, Employee)
- Secure password hashing with bcrypt
- Rate limiting and security headers

### Phase 2: Employee & Department Management ✅
- Full CRUD operations for employees
- Department management with leave policies
- Employee search and filtering
- Employee profile management

### Phase 3: Attendance Management ✅
- Daily attendance marking
- Multiple status types (Present, Absent, Half-day, WFH)
- Work hours calculation
- Monthly reports

### Phase 4: Leave Management ✅
- Leave application workflow
- Leave balance tracking
- Approval/Rejection system
- Leave history

### Phase 5: Onboarding (Backend Complete)
- Document management
- Checklist tracking
- Status management

### Phase 6: Payroll (Backend Complete)
- Salary calculation
- Attendance-based deductions
- Payslip generation
- Bulk payroll processing

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** and **cors** for security

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **React Router** for routing
- **Axios** for API calls
- **React Hot Toast** for notifications

## Project Structure

```
hr-management-system/
├── server/
│   ├── src/
│   │   ├── config/          # Database, JWT configs
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, RBAC, Error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers, validators
│   │   └── app.js           # Express app
│   ├── .env
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # React Context
│   │   ├── services/        # API services
│   │   └── utils/           # Helpers
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee
- `PUT /api/employees/:id` - Update employee
- `PATCH /api/employees/:id/status` - Update status
- `GET /api/employees/stats` - Employee statistics

### Departments
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Deactivate department

### Attendance
- `GET /api/attendance` - List attendance
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `GET /api/attendance/monthly-report` - Monthly report
- `POST /api/attendance/bulk` - Bulk mark attendance

### Leaves
- `GET /api/leaves` - List leaves
- `POST /api/leaves` - Apply for leave
- `PATCH /api/leaves/:id/approve` - Approve leave
- `PATCH /api/leaves/:id/reject` - Reject leave
- `GET /api/leaves/balance/:employeeId` - Get leave balance

### Onboarding
- `GET /api/onboarding` - List onboarding
- `POST /api/onboarding` - Create onboarding
- `PATCH /api/onboarding/:id/checklist/:itemId` - Update checklist

### Payroll
- `GET /api/payroll` - List payroll
- `POST /api/payroll/generate` - Generate payroll
- `POST /api/payroll/generate-bulk` - Bulk generate
- `GET /api/payroll/:id/payslip` - Get payslip

## Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Server (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hr_management
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full system access |
| HR | Employee, Attendance, Leave, Onboarding, Payroll management |
| Employee | View own data, Apply leaves, Mark attendance |

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Rate limiting (100 requests per 15 min)
- Input validation on all endpoints
- CORS configuration
- Security headers with Helmet

## License

MIT