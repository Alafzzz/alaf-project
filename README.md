# Kerala College Hub (Full Stack)

A modern, CollegeDunia-style full-stack platform listing higher education institutions across **Kerala**.

---

## 🌟 Key Features

- **Kerala-Only Directory**: Curated dataset of 200+ colleges across all 14 districts of Kerala.
- **Advanced Explorer & Filters**:
  - Live search by college name, city, or district.
  - Multi-criteria filtering by District, College Type, Course, and Admission Mode.
  - Interactive Fee Slider & custom presets (Top Rated, Budget Friendly, Engineering, Medical).
- **Accreditation Rankings (NAAC)**: Dedicated NAAC grade and CGPA ranking views with verified accreditation metrics.
- **Programs & Streams Explorer**: Explore programs mapped by stream (Engineering, Arts & Science, Management, Medical, Law, Research).
- **Student Decision Guide**: Tailored academic, financial planning, and scholarship guidance.
- **Interactive Reviews**: Student review system with star ratings and feedback storage.
- **Admin Management Portal**:
  - Secure JWT cookie authentication.
  - College CRUD (Create, Read, Update, Delete) with image upload support.
  - Contact message inbox to review student inquiries.
- **Direct Feedback System**: Contact form with automatic database logging and optional SMTP forwarding.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express (REST API with static & clean extensionless routes)
- **Security & Auth**: JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, CORS
- **File Uploads**: `multer`
- **Mail Service**: `nodemailer` (with safe fallback if SMTP is unconfigured)
- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism & Responsive Grids), ES6+ JavaScript
- **Data Persistence**: JSON-based storage (`data/colleges.json`, `data/admin.json`, `data/contactMessages.json`)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests

Verify that all endpoints, auth systems, and routes pass:

```bash
npm test
```

### 3. Start Development Server

```bash
npm run dev
# or
npm start
```

### 4. Open in Browser

Visit:
```text
http://localhost:5000
```

---

## 🔑 Default Credentials

- **Admin Portal**: `http://localhost:5000/admin`
  - **Username**: `alaf15123456789@gmail.com`
  - **Password**: `Admin@12345`

---

## 🌐 Routes & Pages

| Route | Page | Purpose |
|---|---|---|
| `/` or `/index.html` | Home | Hero landing, statistics, and quick navigation |
| `/rankings` | Colleges | Search, filter by fees, stream, and district |
| `/naac-rankings` | NAAC Rankings | Ranked by NAAC grade, CGPA, and status |
| `/programs` | Programs | Stream pathways and matching institutions |
| `/decision-guide` | Decision Guide | Budget, scholarship, and career roadmap |
| `/college?id=:id` | College Details | Courses, fees snapshot, review posting |
| `/about` | About | Mission, coverage, and platform details |
| `/contact` | Contact | Inquiries and feedback submission |
| `/login` | Student Login | Optional student sign in |
| `/signup` | Student Signup | Student account creation |
| `/admin` | Admin Portal | Full college and message management |

---

## 📡 REST API Reference

### Public API

- `GET /api/meta` - Unique districts, types, and courses.
- `GET /api/colleges` - Paginated colleges list (supports `search`, `district`, `type`, `course`, `minFees`, `maxFees`, `page`, `limit`).
- `GET /api/colleges/:id` - Detailed college record by ID.
- `GET /data/colleges.json` - Direct JSON dataset feed.
- `POST /api/contact/send` - Send contact message `{ name, email, message }`.

### Admin API (Protected)

- `POST /api/admin/auth/login` - Admin login `{ username, password }`.
- `POST /api/admin/auth/signup` - Create admin account.
- `GET /api/admin/auth/me` - Current admin session verification.
- `POST /api/admin/auth/logout` - Clear admin session.
- `GET /api/admin/colleges` - List all colleges.
- `POST /api/admin/colleges` - Create a college.
- `PUT /api/admin/colleges/:id` - Update a college.
- `DELETE /api/admin/colleges/:id` - Delete a college.
- `POST /api/admin/colleges/upload` - Upload image for college card.
- `GET /api/admin/messages` - View all submitted contact messages.

---

## 📄 License

MIT
