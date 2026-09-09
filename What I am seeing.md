# What I Am Seeing — Vinta School OS Project Analysis

> **Document Version:** 1.0 — September 2026
> **Purpose:** Complete project documentation for the Vinta School OS full-stack webapp

---

## 1. Project Overview

**Vinta School OS** is a school management SaaS platform targeting private academies in Algeria. It operates under the existing Vinta Automation brand (Vintautomation.com).

### Core MVP Scope
- Student management (profiles, guardians, enrollment)
- Teacher management (profiles, contracts, payroll)
- Class/room tracking (assignments, schedules)
- Manual check-in/check-out attendance
- Weekly calendar with drag-and-drop scheduling
- Per-student billing and payment tracking

### Key Differentiator
**Per-staff personal PIN authentication** — Every staff member has a unique 4-digit PIN. Every action (check-in, billing, etc.) is attributed to the specific staff member who entered their PIN, creating an accountability guarantee for academy owners.

---

## 2. Tech Stack

### Frontend (To Build)
| Technology | Purpose |
|---|---|
| React 18+ | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Vite | Build tool |
| React Router | Client-side routing |
| Zustand | State management |
| Axios | HTTP client |
| Recharts | Charts (billing) |

### Backend (Existing — Flask)
| Technology | Purpose |
|---|---|
| Flask | Web framework |
| SQLAlchemy | ORM |
| Flask-Migrate | Database migrations |
| Flask-JWT-Extended | JWT authentication |
| Flask-SMOREST | API documentation (Swagger) |
| Flask-SocketIO | WebSocket support |
| MySQL/MariaDB | Production database |
| SQLite | Testing database |

### Hosting Target
- **CloudFlare Pages** (frontend SPA)
- **CloudFlare Workers or VPS** (backend API)

---

## 3. Design System

### Color Palette

#### Light Mode
| Token | Hex | Usage |
|---|---|---|
| `--gold` | `#b3872a` | Primary accent, headings, active states |
| `--emerald` | `#0f6b4d` | Secondary accent, success, staff badge |
| `--violet` | `#7c3aed` | Tertiary accent, owner badge |
| `--text` | `#1f1f22` | Primary text |
| `--muted` | `#75726a` | Secondary text, labels |
| `--red` | `#dc2626` | Errors, alerts, danger |
| `--bg` | `#efece4` | Page background |
| `--glass` | `rgba(255,255,255,0.55)` | Panel backgrounds |
| `--glassBorder` | `rgba(255,255,255,0.75)` | Panel borders |
| `--inputBg` | `rgba(255,255,255,0.6)` | Input backgrounds |

#### Dark Mode
| Token | Hex | Usage |
|---|---|---|
| `--gold` | `#e0b93f` | Primary accent (brighter) |
| `--emerald` | `#1fae7c` | Secondary accent (brighter) |
| `--violet` | `#a07cc5` | Tertiary accent |
| `--text` | `#ececec` | Primary text |
| `--muted` | `#9497a1` | Secondary text |
| `--red` | `#e07a6f` | Errors (softer) |
| `--bg` | `#1a1a1c` | Page background |
| `--glass` | `rgba(255,255,255,0.055)` | Panel backgrounds |
| `--glassBorder` | `rgba(255,255,255,0.10)` | Panel borders |
| `--inputBg` | `rgba(255,255,255,0.05)` | Input backgrounds |

### Typography
| Context | Font | Size | Weight |
|---|---|---|---|
| Headings/Logo | Space Grotesk | 14.5px–24px | 500–700 |
| Body/Labels | Inter | 10px–14px | 400–600 |
| PIN digits | Space Grotesk | 20px | 700 |
| Avatar initials | Space Grotesk | 20px–26px | 700 |
| Badges | Inter | 8.5px–12px | 600–700 |

### Glassmorphism Effect
```css
.glass {
  background: var(--glass);
  backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid var(--glassBorder);
  border-radius: var(--radius);
  box-shadow: var(--glassShadow);
  position: relative;
  overflow: hidden;
}

.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--sheen); /* Diagonal gradient overlay */
  pointer-events: none;
}
```

### Border Radius Tokens
| Token | Value | Usage |
|---|---|---|
| `--xs` | 8px | Close buttons, small elements |
| `--sm` | 10px | Inputs, PIN boxes, small cards |
| `--md` | 14px | Buttons, avatars, medium cards |
| `--lg` | 20px | Modals, panels, sidebar |
| `--xl` | 26px | PIN modal, large containers |

### Avatar Gradient Presets (8 pairs)
1. Gold → Emerald: `#b3872a` → `#0f6b4d`
2. Violet → Sky: `#7c3aed` → `#0ea5e9`
3. Red → Orange: `#dc2626` → `#ea580c`
4. Teal → Emerald: `#0d9488` → `#10b981`
5. Pink → Rose: `#db2777` → `#ec4899`
6. Indigo → Violet: `#6366f1` → `#8b5cf6`
7. Amber → Red: `#f59e0b` → `#ef4444`
8. Teal → Cyan: `#14b8a6` → `#06b6d4`

---

## 4. Application Architecture

### Screen State Machine
```
Auth Screen (Login/Signup)
  └→ Profile Selection Screen
       └→ PIN Verification Modal
            └→ Success Screen (3s auto-advance)
                 └→ Dashboard (Main App)
                      ├── Sidebar Navigation
                      ├── Top Bar (Search, Filters, Notifications)
                      └── Content Area (Tab-based pages)
```

### Post-Login Layout
```
┌─────────────┬────────────────────────────────────────┐
│             │  Top Bar (262px height)                 │
│   Sidebar   ├────────────────────────────────────────┤
│   (222px)   │                                        │
│             │  Main Content Area                      │
│  - Logo     │  ┌──────────────┐ ┌────────────────┐  │
│  - Nav      │  │ Calendar/    │ │ Session Detail │  │
│  - Logout   │  │ Schedule     │ │ Panel          │  │
│             │  └──────────────┘ └────────────────┘  │
└─────────────┴────────────────────────────────────────┘
```

---

## 5. Navigation Structure

### Sidebar Items
| Key | Icon | Label | Visible To |
|---|---|---|---|
| `dashboard` | Grid (4 squares) | Dashboard | All |
| `students` | Person+ | Students | All |
| `teachers` | Person circle | Teachers | All |
| `classes` | Chalkboard | Classes | All |
| `calendar` | Calendar | Calendar | All |
| `billing` | Credit card | Billing | Owner only |
| `settings` | Gear | Settings | Owner only |

### Responsive Behavior
- **≥ 900px**: Desktop sidebar visible (222px), hamburger hidden
- **< 900px**: Desktop sidebar hidden, hamburger button appears (40×40px fixed top-left), mobile slide-in sidebar (260px from left with backdrop blur overlay)

---

## 6. Auth Flow

### Login Screen
- Brand mark (gradient square 52×52px)
- "Vinta School OS" heading
- Academy subtitle
- Pill toggle: "Log in" | "Create academy"
- Email + Password inputs
- "Keep this device signed in" checkbox
- "Forgot?" link
- Submit button (gradient gold→emerald)
- Switch to signup link

### Signup Screen
- Academy name input
- Your name input
- Email + Phone (side by side)
- Password input
- Submit: "Create account"
- Switch to login link

### Profile Picker
- "Who's this?" heading
- Profile grid (3 columns)
- Each tile: Gradient avatar (64×64px squircle) + Name + Role badge
- Role badges: "Owner" (gold) | "Staff" (emerald)
- "Add profile" tile (dashed border, + icon)
- Explanatory note about PIN accountability

### PIN Modal
- Backdrop blur overlay
- Avatar (56×56px)
- Profile name
- "Only you know this PIN..." message
- 4 PIN input boxes (44×52px each)
- Auto-submit on 4 digits
- Shake animation on error
- Cancel link

### Profile Creator Modal
- Avatar section: 8 preset gradients + upload option
- Name input
- Role toggle: Owner | Staff
- Phone input (with +213 auto-format)
- 4-digit PIN input
- Confirm PIN input
- Owner PIN verification (for staff creation)

---

## 7. Dashboard Page

### Agenda Board
- Week/Day view toggle
- Time grid (8AM–9PM, hourly rows)
- Session blocks (color-coded by subject)
- "Now" timeline indicator (red line)
- Overlapping session resolver modal

### Session Detail Panel (Right sidebar)
- Subject name + status badge
- Time/Teacher/Classroom/Date chips
- Attendance stats (Present/Absent counts)
- Student roster with:
  - Checkbox for presence toggle
  - Payment status badge (Paid/Due/Overdue)
  - Call/Message action buttons

### Activity Log
- Recent actions list
- Action types: Payment, Check-in, Student, Alert
- Each entry: Icon + Description + Timestamp + Staff name

---

## 8. Students Page

### Stats Rail
- Total students count
- Paid count (green)
- Overdue count (red)

### Student Table
- Columns: Name, Class, Sessions, Status, Plan, Renewal, Actions
- Status badges: Paid (green), Due (yellow), Overdue (red)
- Row click opens profile drawer

### Student Profile Drawer
- Student info header
- Guardian contacts
- Billing calendar (4-week mini-grid)
- Attendance history
- Call/Message buttons

---

## 9. Teachers Page

### Stats Rail
- Total teachers
- Hourly contract count
- Per-student contract count

### Teacher Table
- Columns: Name, Subject, Contract, Rate, Hours/Students, Classes, Actions
- Contract badge: "Hourly" | "Per Student"

### Teacher Profile Drawer
- Teacher info header
- Assigned classes list
- Weekly schedule view
- Payroll summary

---

## 10. Classes Page

### Class Grid
- Card for each class
- Status dot: Red (full), Green (active), Grey (empty)
- Class name, subject, teacher, enrolled count

### Class Detail
- Editable header (name, subject, color)
- Block calendar (Mon–Fri schedule grid)
- Student enrollment list
- Add/remove schedule blocks

---

## 11. Calendar Page

### Subject Palette (Left sidebar 180px)
- Draggable subject cards with color chips
- "Add subject" dashed card
- Default subjects: Math (#b3872a), French (#7c3aed), English (#0ea5e9), Science (#0f6b4d)

### Week View
- 7 columns (Sun–Sat)
- Hourly rows (8AM–9PM)
- Session blocks positioned by time/day
- Drag-to-move blocks
- Edge-resize (top/bottom handles)
- 5-minute snap grid

### Day View
- Single column for selected day
- Full height time grid

### Month View
- Simple grid overview with event chips

### Interactions
- Drag subject from palette → drop on grid → CreateSessionModal
- Drag existing block → move to new time/day
- Resize block edges → adjust duration
- Click block → session detail

---

## 12. Billing Page

### Donut Ring Cards
- Student tuition status (Paid/Due/Overdue)
- Teacher payroll status (Pending/Settled/Overdue)

### Revenue Chart
- Switchable properties:
  - Total income
  - Paid vs. overdue
  - New enrollments vs. cancellations
  - Teacher hours logged
  - Students per teacher ratio
  - Average revenue per student
  - Overdue accounts over time
  - Income by subject

### Stat Buttons
- "This month's income" (expandable)
- "Total enrolled" (expandable)
- Finance breakdown modal

---

## 13. Settings Page

### Sections (Owner-only marked)
| Section | Owner | Staff |
|---|---|---|
| Appearance | ✅ | ✅ |
| My Account | ✅ | ✅ |
| Academy Profile | ✅ | ❌ |
| Staff & Roles | ✅ | ❌ |
| Billing Configuration | ✅ | ❌ |
| Automations | ✅ (Scaler only) | ❌ |
| Data & Export | ✅ | ✅ |
| Subscription | ✅ | ❌ |
| Danger Zone | ✅ | ❌ |

---

## 14. Backend API Reference

### Authentication Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create academy |
| POST | `/api/auth/login` | Owner login |
| GET | `/api/auth/profiles` | List profiles |
| POST | `/api/auth/verify-pin` | PIN authentication |
| POST | `/api/auth/create-owner` | First owner profile |
| POST | `/api/auth/create-profile` | New staff profile |
| POST | `/api/auth/change-pin` | Change PIN |
| GET | `/api/auth/me` | Current user |

### Students Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/students` | List students |
| POST | `/api/students` | Create student |
| GET | `/api/students/:id` | Get student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/:id/guardians` | List guardians |
| POST | `/api/students/:id/guardians` | Add guardian |

### Teachers Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/teachers` | List teachers |
| POST | `/api/teachers` | Create teacher |
| GET | `/api/teachers/:id` | Get teacher |
| PUT | `/api/teachers/:id` | Update teacher |
| DELETE | `/api/teachers/:id` | Delete teacher |

### Classes Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/classes` | List classes |
| POST | `/api/classes` | Create class |
| GET | `/api/classes/:id` | Get class |
| PUT | `/api/classes/:id` | Update class |
| DELETE | `/api/classes/:id` | Delete class |
| GET | `/api/classrooms` | List classrooms |
| POST | `/api/classrooms` | Create classroom |

### Calendar/Sessions Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/calendar/week` | Get week sessions |
| GET | `/api/calendar/day` | Get day sessions |
| POST | `/api/sessions` | Create session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Cancel session |
| POST | `/api/schedules` | Create schedule |

### Attendance Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/attendance/check-in` | Check in student |
| POST | `/api/attendance/check-out` | Check out student |
| GET | `/api/attendance/session/:id` | Get session roster |
| POST | `/api/attendance/session/:id/students` | Add student to session |

### Billing Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/billing/plans` | List payment plans |
| POST | `/api/billing/plans` | Create plan |
| GET | `/api/billing/students/:id` | Get student billing |
| POST | `/api/billing/payments` | Record payment |
| GET | `/api/billing/overdue` | List overdue |

### Analytics Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/analytics/revenue` | Revenue chart data |
| GET | `/api/analytics/export/:type` | CSV export |

### Settings Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/settings` | Get academy settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/settings/staff` | List staff |
| POST | `/api/settings/staff` | Add staff |

### Notifications Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## 15. Data Models

### Academy (Tenant)
```
id: UUID (PK)
name: string
phone: string
email: string
address: string
weekend_day: integer (5=Friday)
current_term: string
created_at: timestamp
updated_at: timestamp
```

### User (Staff/Owner)
```
id: UUID (PK)
academy_id: UUID (FK)
name: string
email: string
phone: string
role: enum ('owner' | 'staff')
pin_hash: string
picture: JSON (nullable)
is_active: boolean
created_at: timestamp
updated_at: timestamp
```

### Student
```
id: UUID (PK)
academy_id: UUID (FK)
first_name: string
last_name: string
phone: string
parent_phone: string
notes: text
created_at: timestamp
updated_at: timestamp
```

### Teacher
```
id: UUID (PK)
academy_id: UUID (FK)
first_name: string
last_name: string
phone: string
subject: string
notes: text
contract_type: enum ('hourly' | 'per_student')
hourly_rate: integer (nullable)
per_student_rate: integer (nullable)
created_at: timestamp
updated_at: timestamp
```

### Class
```
id: UUID (PK)
academy_id: UUID (FK)
name: string
subject: string
color: string (hex)
teacher_id: UUID (FK, nullable)
capacity: integer
notes: text
created_at: timestamp
updated_at: timestamp
```

### Session
```
id: UUID (PK)
academy_id: UUID (FK)
class_id: UUID (FK)
schedule_id: UUID (FK, nullable)
teacher_id: UUID (FK)
classroom_id: UUID (FK, nullable)
date: date
start_time: time
end_time: time
subject: string
status: enum ('scheduled' | 'in_progress' | 'completed' | 'cancelled')
created_at: timestamp
```

### StudentBilling
```
id: UUID (PK)
student_id: UUID (FK)
payment_plan_id: UUID (FK)
amount_da: integer
status: enum ('paid' | 'due' | 'overdue')
due_date: date
paid_date: date (nullable)
paid_amount: integer (nullable)
cycle_start: date
cycle_end: date
notes: text
created_at: timestamp
updated_at: timestamp
```

---

## 16. Frontend File Structure

```
vinta-school-os/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root component with providers
│   │   ├── router.tsx           # React Router configuration
│   │   └── providers.tsx        # Theme, Auth, Toast providers
│   │
│   ├── components/
│   │   ├── ui/                  # Shared UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── PINInput.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   └── layout/              # Layout components
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── PageContainer.tsx
│   │
│   ├── features/                # Feature modules
│   │   ├── auth/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── ProfilePicker.tsx
│   │   │   ├── PINModal.tsx
│   │   │   ├── ProfileCreator.tsx
│   │   │   └── SuccessScreen.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AgendaBoard.tsx
│   │   │   ├── SessionDetail.tsx
│   │   │   └── ActivityLog.tsx
│   │   │
│   │   ├── students/
│   │   │   ├── StudentsPage.tsx
│   │   │   ├── StudentTable.tsx
│   │   │   ├── StudentDrawer.tsx
│   │   │   └── StudentForm.tsx
│   │   │
│   │   ├── teachers/
│   │   │   ├── TeachersPage.tsx
│   │   │   ├── TeacherTable.tsx
│   │   │   └── TeacherDrawer.tsx
│   │   │
│   │   ├── classes/
│   │   │   ├── ClassesPage.tsx
│   │   │   ├── ClassGrid.tsx
│   │   │   └── ClassDetail.tsx
│   │   │
│   │   ├── calendar/
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── SubjectPalette.tsx
│   │   │   └── SessionBlock.tsx
│   │   │
│   │   ├── billing/
│   │   │   ├── BillingPage.tsx
│   │   │   ├── DonutCards.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── FinanceBreakdown.tsx
│   │   │
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── Appearance.tsx
│   │       ├── AcademyProfile.tsx
│   │       ├── StaffRoles.tsx
│   │       └── BillingConfig.tsx
│   │
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # Axios instance + interceptors
│   │   ├── cn.ts                # Tailwind class merge utility
│   │   ├── formatters.ts        # Phone, currency, date formatters
│   │   └── constants.ts         # Design tokens, nav items, options
│   │
│   ├── stores/                  # State management
│   │   ├── authStore.ts         # JWT, current user, academy ID
│   │   ├── themeStore.ts        # Light/dark mode
│   │   └── uiStore.ts           # Sidebar, modals, toasts
│   │
│   ├── types/                   # TypeScript interfaces
│   │   ├── auth.ts
│   │   ├── student.ts
│   │   ├── teacher.ts
│   │   ├── class.ts
│   │   ├── calendar.ts
│   │   ├── billing.ts
│   │   └── settings.ts
│   │
│   └── styles/
│       └── globals.css          # Tailwind imports + CSS variables
│
├── public/
│   └── favicon.svg
│
├── tailwind.config.ts
├── vite.config.ts
├── package.json
├── tsconfig.json
├── index.html
└── .env.example
```

---

## 17. Implementation Phases

### Phase 1: Documentation ✅
- [x] Create "What I am seeing.md"

### Phase 2: Project Setup
- [ ] Initialize Vite + React + TypeScript
- [ ] Configure Tailwind CSS with design tokens
- [ ] Set up project structure
- [ ] Create base UI components

### Phase 3: Auth Flow
- [ ] AuthScreen (Login/Signup)
- [ ] ProfilePicker
- [ ] PINModal
- [ ] ProfileCreator
- [ ] SuccessScreen

### Phase 4: App Shell
- [ ] AppShell layout
- [ ] Sidebar (responsive)
- [ ] TopBar (search, filters, notifications)
- [ ] ThemeToggle

### Phase 5: Dashboard
- [ ] AgendaBoard (week/day view)
- [ ] SessionDetail panel
- [ ] ActivityLog

### Phase 6: Students/Teachers/Classes
- [ ] StudentsPage + table + drawer
- [ ] TeachersPage + table + drawer
- [ ] ClassesPage + grid + detail

### Phase 7: Calendar/Billing/Settings
- [ ] CalendarPage (drag-and-drop)
- [ ] BillingPage (charts, donuts)
- [ ] SettingsPage (multi-section)

### Phase 8: Backend Integration
- [ ] API client setup
- [ ] Auth integration
- [ ] CRUD operations
- [ ] Real-time updates

### Phase 9: Testing
- [ ] Component tests
- [ ] Integration tests
- [ ] Responsive tests
- [ ] Performance tests

### Phase 10: Security Audit
- [ ] XSS testing
- [ ] Auth testing
- [ ] API security
- [ ] Document findings

### Phase 11: Deployment
- [ ] Production build
- [ ] CloudFlare Pages setup
- [ ] Environment config
- [ ] Performance optimization

---

## 18. Currency & Locale

- **Currency:** Algerian Dinar (DZD / DA)
- **Phone format:** +213 followed by carrier code
- **Weekend:** Friday (day 5)
- **Week start:** Sunday (day 0)
- **Languages:** French (default), Arabic
- **Time format:** 24-hour (08:00–21:00)

---

*Document created: September 2026*
*Source: Vinta School OS mockups, backend code, and architecture documentation*
