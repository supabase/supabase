# UR Life - Supabase Edition 🎓

<p align="center">
  <img src="src/assets/symbol_only.svg" alt="University of Rochester" width="120">
</p>

<h3 align="center">University of Rochester Campus Life Assistant</h3>
<p align="center">Powered by Supabase</p>

---

## 🌟 Overview

**UR Life v2.0** is a complete rewrite of the original UR Life application, now powered by Supabase! This version replaces the Python backend and JSON file storage with a modern, scalable PostgreSQL database and real-time capabilities.

### What's New in v2.0

- ✅ **Supabase Backend** - PostgreSQL database with Row Level Security
- ✅ **Real Authentication** - Secure user authentication with Supabase Auth
- ✅ **Real-time Sync** - Data syncs across all devices instantly
- ✅ **Scalable Architecture** - Production-ready infrastructure
- ✅ **Modern Stack** - Vite + ES6 modules for blazing fast development
- ✅ **No Server Required** - Fully serverless architecture

---

## ✨ Features

### 📝 Task Management
- Create, complete, and organize daily tasks
- Task history with restore functionality
- Date-based organization
- Real-time synchronization

### 📊 Degree Progress Tracker
- Track major requirements across categories
- Visual progress indicators
- Dynamic progress calculation
- Persistent state across sessions

### 📅 Course Calendar
- Interactive weekly schedule
- Precise time slots (5-minute intervals)
- Visual course blocks
- Add, edit, delete courses
- Location tracking

### 📧 Mailing List Manager
- Organized contacts by category
- One-click email links
- Quick search and filtering
- Categories: Professors, TAs, Classmates, Friends, Clubs, Research

### 👤 Profile Management
- Customizable avatars
- Update personal information
- Secure password changes
- Multi-device synchronization

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account (free tier works great!)
- Git

### Installation

1. **Clone the repository**

```bash
cd /path/to/Supabase/apps/ur-life
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up Supabase**

Create a new project at [supabase.com](https://supabase.com)

4. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. **Run database migrations**

```bash
# Initialize local Supabase (optional, for local development)
pnpm supabase:start

# Or apply migrations to your cloud project
# Copy the SQL from supabase/migrations/20250104000000_create_ur_life_schema.sql
# And run it in your Supabase SQL Editor
```

6. **Start development server**

```bash
pnpm dev
```

The app will open at `http://localhost:3000`

---

## 🗄️ Database Schema

### Tables

#### `profiles`
Stores user profile information
- `id` (UUID, FK to auth.users)
- `net_id` (unique)
- `name`, `email`, `major`, `year`
- `avatar` (emoji)

#### `tasks`
User tasks and to-do items
- `id` (UUID)
- `user_id` (FK)
- `text`, `completed`, `date`

#### `task_history`
Completed tasks history
- `id` (UUID)
- `user_id` (FK)
- `text`, `completed_at`, `original_date`

#### `contacts`
Mailing list contacts
- `id` (UUID)
- `user_id` (FK)
- `category`, `name`, `email`

#### `degree_progress`
Degree requirement tracking
- `id` (UUID)
- `user_id` (FK)
- `category`, `course_code`, `course_name`, `completed`

#### `courses`
Weekly course schedule
- `id` (UUID)
- `user_id` (FK)
- `day`, `start_time`, `end_time`
- `course_name`, `location`, `color`

### Security

All tables use Row Level Security (RLS) policies ensuring users can only access their own data.

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with CSS Grid/Flexbox
- **JavaScript (ES6+)** - Application logic
- **Vite** - Build tool and dev server

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **PostgREST** - Auto-generated REST API
- **GoTrue** - Authentication

### Hosting
- **Vercel/Netlify** - Frontend hosting (recommended)
- **Supabase** - Backend infrastructure

---

## 📁 Project Structure

```
ur-life/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client & API functions
│   ├── js/
│   │   ├── login.js             # Login page logic
│   │   └── dashboard.js         # Main app logic
│   ├── styles/
│   │   ├── login.css            # Login page styles
│   │   └── dashboard.css        # Dashboard styles
│   └── assets/
│       └── symbol_only.svg      # UR logo
├── supabase/
│   ├── config.toml              # Supabase config
│   └── migrations/
│       └── 20250104000000_create_ur_life_schema.sql
├── index.html                   # Login page
├── dashboard.html               # Main application
├── vite.config.js              # Vite configuration
├── package.json
└── README.md
```

---

## 🔐 Authentication

### Demo Accounts

For testing purposes, you'll need to create demo accounts in your Supabase project:

| User | Net ID | Email | Password |
|------|--------|-------|----------|
| 🦊 Fox | fox123 | fox123@ur-life.app | rochester2025 |
| 🐻 Bear | bear456 | bear456@ur-life.app | yellowjacket |
| 🐱 Cat | cat789 | cat789@ur-life.app | meowmeow123 |

You can create these in Supabase Dashboard under Authentication > Users.

---

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
pnpm build
vercel --prod
```

3. **Set environment variables in Vercel Dashboard**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. **Build the project**

```bash
pnpm build
```

2. **Deploy**

```bash
netlify deploy --prod --dir=dist
```

3. **Set environment variables in Netlify Dashboard**

---

## 📊 API Functions

All API functions are in `src/lib/supabase.js`:

### Authentication
- `signIn(netId, password)`
- `signUp(netId, password, userData)`
- `signOut()`
- `getCurrentUser()`
- `updatePassword(newPassword)`

### Profile
- `getProfile(userId)`
- `updateProfile(userId, updates)`

### Tasks
- `getTasks(userId)`
- `addTask(userId, taskData)`
- `updateTask(taskId, updates)`
- `deleteTask(taskId)`
- `completeTask(taskId, userId, taskText, originalDate)`

### Task History
- `getTaskHistory(userId)`
- `restoreTask(historyId, userId, taskText, originalDate)`

### Contacts
- `getContacts(userId)`
- `addContact(userId, contactData)`
- `deleteContact(contactId)`

### Degree Progress
- `getDegreeProgress(userId)`
- `updateDegreeProgress(userId, category, courseCode, completed)`
- `initializeDegreeProgress(userId, major)`

### Courses
- `getCourses(userId)`
- `addCourse(userId, courseData)`
- `updateCourse(courseId, updates)`
- `deleteCourse(courseId)`

---

## 🔧 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Start local Supabase
pnpm supabase:start

# Stop local Supabase
pnpm supabase:stop

# Check Supabase status
pnpm supabase:status

# Reset database
pnpm supabase:reset

# Generate TypeScript types from database
pnpm supabase:gen-types
```

### Local Development with Supabase

For full local development:

1. Start local Supabase:
```bash
pnpm supabase:start
```

2. Update `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

3. Start dev server:
```bash
pnpm dev
```

---

## 🐛 Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file
- Make sure you're using the correct anon key from Supabase Dashboard

### Database tables not found
- Run the migration SQL in Supabase SQL Editor
- Check table permissions and RLS policies

### CORS errors
- Make sure your Supabase project URL is correct
- Check allowed URLs in Supabase Dashboard > Authentication > URL Configuration

### Data not syncing
- Open browser console to check for errors
- Verify user is authenticated
- Check RLS policies in Supabase

---

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Blackboard integration
- [ ] Calendar export (iCal)
- [ ] Group project collaboration
- [ ] AI course recommendations
- [ ] Real-time collaboration
- [ ] Dark mode

---

## 📝 Migration from v1.0

If you're migrating from the original Python/JSON version:

1. Export your data from `database.json`
2. Run the migration script (TODO: create migration script)
3. Import data into Supabase tables
4. Update user credentials

---

## 🤝 Contributing

This project is part of CSC 212 coursework at the University of Rochester.

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

---

## 📄 License

Academic project for University of Rochester CSC 212.

© 2025 University of Rochester

---

## 🙏 Acknowledgments

- **University of Rochester** for official branding
- **Supabase** for amazing backend infrastructure
- **CSC 212** course staff for guidance
- **Original UR Life v1.0** project contributors

---

## 📞 Support

For issues or questions:

- Check the [Troubleshooting](#-troubleshooting) section
- Review [Supabase documentation](https://supabase.com/docs)
- Contact CSC 212 course staff

---

<p align="center">
  <strong>Made with ❤️ for University of Rochester</strong><br>
  <em>Meliora - Ever Better</em>
</p>
