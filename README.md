# Mayaa Travels - Fleet Management System

A comprehensive fleet management system for Mayaa Enterprises to manage 24 vehicles, drivers, and monthly trip sheets with automated billing calculations.

## Project Status

**Current Branch:** `dev`
**Latest Commit:** Module 7 - Admin Tripsheet Management completed and pushed

### Completed Modules

✅ **Module 1-5:** Backend Setup & Core Models
✅ **Module 6:** Driver Portal (Dashboard, Add Entry, Tripsheet View, Profile)
✅ **Module 7:** Admin Tripsheet Management (List, Detail, Approve/Reject, Excel Export)

### In Progress

🔄 **Module 8:** Coming next

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Authentication:** NextAuth.js
- **State Management:** React Query (TanStack Query)
- **Excel Export:** ExcelJS
- **UI Components:** Radix UI, Lucide Icons

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7.0+ (running locally on port 27017)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/nextologyinnovationspvtltd-lgtm/mayaa-Travels.git
cd "Mayaa Travels/fleet-management"

# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with:
# MONGODB_URI=mongodb://localhost:27017/fleet-management
# NEXTAUTH_SECRET=fleet-management-secret-key-2024-change-in-production
# NEXTAUTH_URL=http://localhost:3000

# Seed the database
npm run seed

# Start development server
npm run dev
```

### Default Credentials

**Admin:**
- Email: `admin@fleet.com`
- Password: `Admin@123`

**Driver:**
- Email: `driver@fleet.com`
- Password: `Driver@123`

## Project Structure

```
fleet-management/
├── backend/
│   ├── models/          # Mongoose models (User, Vehicle, VehicleType, Tripsheet)
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Utility functions (time calculator)
├── src/
│   ├── app/
│   │   ├── (auth)/      # Login page
│   │   ├── admin/       # Admin dashboard, tripsheets
│   │   ├── driver/      # Driver dashboard, add entry, tripsheet, profile
│   │   └── api/         # API routes
│   ├── components/
│   │   ├── admin/       # Admin-specific components
│   │   ├── driver/      # Driver-specific components
│   │   ├── layouts/     # Sidebars, headers
│   │   ├── shared/      # Shared components
│   │   └── ui/          # Shadcn/ui components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, auth, database
│   └── services/        # API service functions
└── public/              # Static assets
```

## Database

**Database Name:** `fleet-management`
**Connection:** `mongodb://localhost:27017`
**Type:** Local MongoDB (development)

### Collections

- **users** - Admins and drivers
- **vehicles** - 24 vehicles with routes
- **vehicletypes** - Dzire, Bolero, Crysta with billing rules
- **tripsheets** - Monthly trip sheets with daily entries

### Viewing Database

**Option 1: VS Code Extension**
- Install "MongoDB for VS Code"
- Connect to `mongodb://localhost:27017`
- Browse `fleet-management` database

**Option 2: MongoDB Compass**
- Download from mongodb.com/compass
- Connect to `mongodb://localhost:27017`

**Option 3: Command Line**
```bash
# Run database inspection script
node check-db.js

# Or use queries.mongodb file in VS Code
# Open queries.mongodb and run queries with Ctrl+Alt+N
```

## Features by Module

### Module 6: Driver Portal

**Dashboard**
- View today's trip status (pending/working/off)
- Monthly summary (working days, off days, KMs, hours)
- Recent trip entries
- Vehicle information

**Add Entry**
- Daily trip entry form
- Auto-validation (opening KM > closing KM check)
- Working hours calculation
- Fuel tracking (liters, amount)
- Mark OFF days (Saturday/Sunday)

**Tripsheet View**
- Monthly calendar view of all entries
- Filter by month/year
- Submit tripsheet for approval
- View submission status

**Profile**
- View driver details
- Monthly salary preview with billing breakdown
- Vehicle assignment info

### Module 7: Admin Tripsheet Management

**Tripsheet Listing**
- Filter by month, year, status, vehicle
- Search by driver name (debounced)
- Stats cards (Total, Draft, Submitted, Approved)
- Sortable table with pagination
- Status badges (Draft, Submitted, Approved)

**Tripsheet Detail**
- Full entry list for the month
- Summary cards (working days, KMs, hours)
- Fuel summary (internal only)
- Billing preview with breakdown
- Approve/Reject actions
- Excel download button

**Billing Calculation**
- Base monthly rental
- Extra day charges (beyond 20 days)
- Extra KM charges (beyond 2000 KMs)
- Extra hour charges (beyond 10 hours/day)
- Amount in Indian words format

**Excel Export**
- Exact format matching specifications
- Vehicle and driver details
- Route information
- Daily entries with S.No for working days
- Gray background for OFF days
- Complete billing breakdown
- Amount in words

## API Routes

### Driver APIs
- `GET /api/driver/dashboard` - Dashboard data
- `GET /api/driver/info` - Driver and vehicle info
- `GET /api/driver/tripsheet` - Monthly tripsheet
- `GET /api/driver/tripsheet/entry` - Single entry
- `POST /api/driver/tripsheet/entry` - Create/update entry
- `POST /api/driver/tripsheet/submit` - Submit for approval
- `GET /api/driver/previous-km` - Previous day's closing KM
- `GET /api/driver/salary-preview` - Monthly salary calculation

### Admin APIs
- `GET /api/admin/tripsheets` - List all tripsheets with filters
- `GET /api/admin/tripsheets/[id]` - Get single tripsheet details
- `POST /api/admin/tripsheets/[id]/approve` - Approve tripsheet
- `POST /api/admin/tripsheets/[id]/reject` - Reject with reason
- `GET /api/admin/tripsheets/[id]/download` - Download Excel

## Key Business Logic

### Billing Rules (per vehicle type)

**Maruti Dzire (DZIRE):**
- Base: ₹50,000 for 20 days, 2000 KMs, 10 hrs/day
- Extra day: ₹2,500
- Extra KM: ₹25
- Extra hour: ₹250

**Mahindra Bolero (BOLERO):**
- Base: ₹52,000 for 20 days, 2000 KMs, 10 hrs/day
- Extra day: ₹2,600
- Extra KM: ₹26
- Extra hour: ₹260

**Innova Crysta (CRYSTA):**
- Base: ₹54,000 for 20 days, 2000 KMs, 10 hrs/day
- Extra day: ₹2,700
- Extra KM: ₹27
- Extra hour: ₹270

### Validation Rules

1. **Opening KM must be greater than previous day's closing KM**
2. **Working hours calculated automatically from start/end time**
3. **Only ONE entry per day allowed**
4. **Cannot edit entries after submission**
5. **Admin can approve/reject submitted tripsheets**
6. **Rejected tripsheets return to draft status**

## Known Issues & Fixes

### VehicleType Schema Registration Error

**Issue:** `MissingSchemaError: Schema hasn't been registered for model "VehicleType"`

**Fix Applied:** Added explicit model registration in driver API routes:
```typescript
// Ensure VehicleType model is registered
VehicleType.modelName;

const vehicle = await Vehicle.findById(driver.assignedVehicleId)
  .populate({ path: 'vehicleTypeId', model: VehicleType })
  .lean();
```

**Files Fixed:**
- `src/app/api/driver/dashboard/route.ts`
- `src/app/api/driver/info/route.ts`

**To test the fix:**
1. Restart dev server: `npm run dev`
2. Clear Next.js cache: Delete `.next` folder
3. Login as driver and access dashboard

## Development

### Running the Project

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Seed database
npm run seed

# Check database contents
node check-db.js
```

### Port Information

- **Default:** `http://localhost:3000`
- **Alternative ports:** 3001, 3002, 3003 (auto-assigned if 3000 is busy)

### MongoDB Tools

```bash
# Check MongoDB service (Windows)
powershell -Command "Get-Service -Name MongoDB"

# Inspect database
node check-db.js

# Run MongoDB queries
# Open queries.mongodb in VS Code and use Ctrl+Alt+N
```

## Git Workflow

```bash
# Check current branch
git branch

# Create feature branch
git checkout -b feature/module-name

# Commit changes
git add -A
git commit -m "Description"

# Push to dev
git push origin dev
```

## Dependencies

### Production
- next: 14.2.33
- react: ^18
- mongoose: ^8.9.3
- next-auth: ^4.24.11
- @tanstack/react-query: ^5.62.14
- @tanstack/react-table: ^8.20.6
- exceljs: ^4.4.0
- sonner: ^1.7.1
- lucide-react: ^0.468.0

### Development
- typescript: ^5
- tailwindcss: ^3.4.1
- @types/node: ^20

## Next Steps (Module 8)

Coming soon...

## Contributing

1. Create feature branch from `dev`
2. Make changes
3. Test thoroughly
4. Commit with clear message
5. Push to `dev` branch

## License

Proprietary - Mayaa Enterprises

---

**Last Updated:** December 12, 2025
**Version:** 1.0.0 (Module 7 completed)
