# Research Repository System

A full-stack web application for managing research papers with user authentication and admin controls.

## Features

- **User Management**: Student and admin registration with approval workflow
- **Two-Factor Authentication**: TOTP (Google Authenticator) support for admin accounts with QR code generation
- **Research Upload**: PDF research paper uploads with metadata (title, authors, adviser, department, year, semester, keywords, abstract)
- **Research Management**: Approve/reject/archive/restore research papers with status tracking
- **Advanced Search**: Multi-field search with pagination, sorting (newest/oldest/alphabetical), and filters (keyword, author, department, year, semester, keywords)
- **Statistics Dashboard**: Comprehensive analytics with charts for admins including:
  - Overall statistics (totals, growth metrics, top departments)
  - Department-wise statistics with filtering
  - Adviser-wise statistics with filtering
  - Yearly statistics
  - Top authors and keywords
  - Monthly upload trends
- **Data Export**: Export filtered statistics data as PDF reports with dynamic filenames based on filters
- **Password Reset**: 
  - Admin-mediated password reset for students
  - TOTP-based password reset for admins with account lockout protection
- **Backup & Restore**: Full backup and restore functionality for research papers and metadata
- **Analytics Tracking**: View and download counters for research papers
- **File Management**: Secure PDF file storage and retrieval with 200MB file size limit
- **Dark Mode**: Modern UI with dark mode support

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **multer** for file uploads (200MB limit)
- **speakeasy** for TOTP (Google Authenticator) support
- **qrcode** for QR code generation
- **archiver** for ZIP backup creation
- **unzipper** for backup restoration
- **ReportLab** (Python) for PDF report generation

### Frontend
- **Vanilla HTML/CSS/JavaScript**
- **Chart.js** for statistics visualization
- **Responsive design** with modern UI and dark mode support
- **Role-based access control** (Student/Admin)
- **Font Awesome** icons

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd research-repository2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/research-repo
   JWT_SECRET=your-super-secret-jwt-key-here
   ADMIN_SECRET_KEY=your-admin-secret-key-here
   PORT=5000
   NODE_ENV=development
   ```
   
   **Note**: The server runs on `0.0.0.0:5000` by default, making it accessible from the network. Use your machine's IP address to access it from other devices.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Usage

### Student Registration
1. Go to the registration page
2. Select "Student" role
3. Fill in required information (School ID, Department, etc.)
4. Wait for admin approval

### Admin Registration
1. Go to the registration page
2. Select "Admin" role
3. Fill in required information including the admin secret key
4. Scan the QR code with Google Authenticator (or manually enter the TOTP secret)
5. Account is immediately active
6. **Important**: Save your TOTP secret/QR code - you'll need it for password resets

### Research Upload
1. Login as an approved student
2. Navigate to "Upload Research" tab
3. Fill in research details and upload PDF file
4. Wait for admin approval

### Admin Management
1. Login as admin
2. Access admin dashboard
3. Manage user approvals and research approvals
4. Archive/restore research papers
5. View statistics and analytics with filtering options (year/semester filters)
6. Export filtered data as PDF reports with dynamic filenames
7. Handle password reset requests (students)
8. Create new admin accounts with TOTP setup
9. Backup and restore research data
10. View pending, archived, and approved research separately

### Data Export Features
The admin dashboard includes powerful export capabilities:

- **Filtered Export**: Export only data matching selected filters (year/semester)
- **Dynamic Filenames**: Files are automatically named based on applied filters
  - `Research_Statistics_1st_Semester_2024.pdf` (when filters are applied)
  - `Research_Statistics_All_Semesters_All_Years.pdf` (when no filters are applied)
- **PDF Format**: Professional PDF reports with:
  - Summary statistics (total research, top department, top adviser)
  - Department breakdown with percentages
  - Adviser breakdown with percentages
  - Custom header with logo and filter information
  - Footer with export date and admin name
- **Comprehensive Data**: Includes both department and adviser statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (student or admin)
- `POST /api/auth/login` - User login (supports schoolId for students, username for admins)
- `POST /api/auth/change-password` - Change password (authenticated users)
- `POST /api/auth/admin/create` - Create admin account (admin only, returns QR code)
- `GET /api/auth/admin/:username/qrcode` - Get QR code for admin TOTP setup (admin only)
- `GET /api/auth/users` - Get all users (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)
- `PUT /api/auth/users/:id/approve` - Approve/reject student registration (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PUT /api/users/:id/approve` - Approve/reject user (admin only)

### Research
- `GET /api/research` - Get all approved research papers
- `POST /api/research` - Upload research paper (authenticated users)
- `GET /api/research/search` - Advanced search with filters (keyword, author, department, year, semester, keywords, sortBy, page, limit)
- `GET /api/research/:id/pdf` - Serve PDF file for research paper
- `POST /api/research/:id/view` - Increment view count (authenticated users)
- `POST /api/research/:id/download` - Increment download count (authenticated users)
- `GET /api/research/pending` - Get pending research papers (admin only)
- `GET /api/research/archived` - Get archived research papers (admin only)
- `GET /api/research/archived/count` - Get archived research count (admin only)
- `PUT /api/research/:id/approve` - Approve research paper (admin only)
- `PUT /api/research/:id/reject` - Reject research paper (admin only)
- `PUT /api/research/:id/archive` - Archive research paper (admin only)
- `PUT /api/research/:id/restore` - Restore archived research paper (admin only)
- `DELETE /api/research/:id` - Delete research paper and PDF file (admin only)
- `DELETE /api/research` - Clear all research (admin only, query: `keepFiles=true` to preserve files)
- `GET /api/research/backup` - Backup all research as ZIP file (admin only)
- `POST /api/research/restore` - Restore from backup ZIP (admin only, multipart/form-data, field: `backup`)
- `POST /api/research/seed-samples` - Seed sample pending and archived research (admin only)

### Statistics
- `GET /api/statistics/overall` - Overall statistics (admin only)
- `GET /api/statistics/by-department` - Department statistics with optional filters (admin only, query: `year`, `semester`)
- `GET /api/statistics/by-adviser` - Adviser statistics with optional filters (admin only, query: `year`, `semester`)
- `GET /api/statistics/by-year` - Yearly statistics (admin only)
- `GET /api/statistics/top-authors` - Top authors (admin only, query: `limit=10`)
- `GET /api/statistics/top-keywords` - Top keywords (admin only, query: `limit=10`)
- `GET /api/statistics/trends` - Monthly upload trends (admin only)
- `GET /api/statistics/export-pdf` - Export filtered statistics as PDF (admin only, query: `year`, `semester`)

### Password Reset
- `POST /api/reset/request-reset` - Request password reset (students, requires schoolId)
- `POST /api/reset/admin-reset` - Admin password reset with TOTP verification (requires username, totpCode, newPassword)
- `POST /api/reset/probe-identifier` - Determine if identifier is admin or student
- `GET /api/reset/reset-requests` - Get all reset requests (admin only)
- `PUT /api/reset/reset-request/:id` - Handle reset request (admin only, body: `status`, `newPassword`)

## File Structure

```
research-repository2/
├── backend/
│   ├── controllers/          # Route controllers
│   │   ├── authController.js # Authentication & user management
│   │   └── researchController.js # Research CRUD operations
│   ├── middleware/           # Authentication middleware
│   │   └── auth.js           # JWT verification & admin-only checks
│   ├── models/               # MongoDB models
│   │   ├── User.js           # User schema (student/admin)
│   │   ├── Research.js       # Research paper schema
│   │   └── ResetRequest.js   # Password reset request schema
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User management routes
│   │   ├── research.js       # Research management routes
│   │   ├── statistics.js     # Statistics & export routes
│   │   └── reset.js          # Password reset routes
│   ├── scripts/              # Utility scripts
│   │   ├── generate_pdf.py   # PDF report generation (Python)
│   │   ├── generate_report.py # Additional report generation
│   │   ├── fix-admin-accounts.js # Admin account fixes
│   │   ├── fix-uploads.js    # Upload directory setup
│   │   └── seed*.js          # Database seeding scripts
│   ├── templates/            # Document templates
│   │   └── datatemplate.docx # Word template
│   ├── uploads/              # Uploaded files
│   │   ├── research/         # Research PDF files
│   │   └── backups/          # Backup ZIP files
│   └── server.js             # Main Express server
├── frontend/
│   ├── index.html            # Landing/login page
│   ├── register.html         # Registration page
│   ├── dashboard.html        # Student dashboard
│   ├── admin-dashboard.html  # Admin dashboard
│   ├── forgot-password.html  # Password reset page
│   ├── script.js             # Frontend JavaScript
│   ├── style.css             # Main stylesheet
│   ├── darkmode.css          # Dark mode styles
│   ├── ecalogo.png           # Logo image
│   └── exact.png             # Additional image assets
├── uploads/                  # Upload directory (created at runtime)
│   └── research/             # Research PDF files
├── backup/                   # Backup files directory
├── docs/                     # Documentation
│   ├── login-flowchart.dot   # Login flowchart
│   └── system-flowchart.*    # System flowcharts
├── venv/                     # Python virtual environment
├── config/                   # Configuration files
├── package.json              # Node.js dependencies
├── TROUBLESHOOTING.md        # Troubleshooting guide
└── README.md                 # This file
```

## Security Features

- **JWT-based authentication** with token expiration (1 day)
- **Password hashing** with bcrypt (salt rounds: 10)
- **Two-Factor Authentication (2FA)** for admin accounts using TOTP (Google Authenticator)
- **Account lockout protection** for admin TOTP (5 failed attempts = 15 minute lockout)
- **Role-based access control** (Student/Admin) with middleware protection
- **File type validation** (PDF only, MIME type checking)
- **File size limits** (200MB for research PDFs, 2GB for backup ZIPs)
- **Input validation and sanitization** (regex escaping, field length checks)
- **Environment variable configuration** for sensitive data
- **Query parameter sanitization** for search functionality
- **Student approval workflow** (students require admin approval before login)
- **Research approval workflow** (student uploads require admin approval)

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Migration Scripts
Utility scripts are available in `backend/scripts/`:
- `fix-admin-accounts.js` - Fix admin account statuses
- `fix-uploads.js` - Create upload directories
- `generate_pdf.py` - Generate PDF reports using ReportLab
- `generate_report.py` - Generate comprehensive research reports
- `seed_from_uploads.js` - Seed database from uploaded PDFs
- `seedAcademicData.js` - Seed academic data
- `seedBulkPending.js` - Seed bulk pending research
- `seedMoreApproved.js` - Seed additional approved research
- `seedMoreStudentsStatus.js` - Seed student statuses
- `seedStudents.js` - Seed student accounts

### Python Environment Setup
For PDF generation features, ensure Python virtual environment is set up:
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install Python dependencies
pip install reportlab pillow PyPDF2
```

**Note**: The PDF generation script (`generate_pdf.py`) requires Python 3.x and the ReportLab library. The script generates professional PDF reports with:
- Custom headers with logo
- Summary statistics tables
- Department and adviser breakdown tables
- Dynamic filenames based on filters
- Footer with export date and admin name

## Documentation

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Step-by-step troubleshooting guide for common issues
- **[API Documentation](#api-endpoints)** - Complete API endpoint reference
- **[System Architecture](#file-structure)** - Project structure and component overview
- **Flowcharts** - Available in `docs/` directory (login-flowchart.dot, system-flowchart.*)

## Additional Features

### Search Functionality
- Multi-field search across title, abstract, authors, keywords, department, adviser, and year
- Advanced filtering by author, department, year, semester, and keywords
- Pagination support (default: 20 items per page, max: 100)
- Sorting options: newest, oldest, alphabetical
- Case-insensitive search with regex support
- Status filtering (pending, approved, rejected, archived)

### Research Status Management
- **Pending**: Newly uploaded research awaiting approval
- **Approved**: Research approved by admin (visible to all users)
- **Rejected**: Research rejected by admin (hidden from public view)
- **Archived**: Soft-deleted research (can be restored)

### Backup & Restore
- **Backup**: Creates ZIP file containing all research PDFs and metadata.json
- **Restore**: Upload backup ZIP to restore research papers and files
- Backup includes complete metadata (title, authors, department, year, semester, keywords, abstract, views, downloads, status)

### Network Access
The server runs on `0.0.0.0:5000` by default, making it accessible from:
- Localhost: `http://localhost:5000`
- Network: `http://<your-ip>:5000`
- Check your IP with `ipconfig` (Windows) or `ifconfig` (Linux/Mac)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Notes

- The default MongoDB database name is `research-repo` (can be changed via `MONGO_URI` environment variable)
- Admin accounts require TOTP setup during registration - ensure Google Authenticator is installed
- Student accounts require admin approval before they can log in
- Research papers uploaded by admins are auto-approved
- Archived research papers are excluded from public search results
- Backup files are stored in `uploads/backups/` directory
- PDF files are stored in `uploads/research/` directory
#   r e s e a r c h - r e p o s i t o r y 2 
 
 