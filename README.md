# Library Ideas Web App

## Group Info
- **Course Code**: COMP3810SEF
- **Group No**: 17
- **Members**: [List student names + SID]

---

## Project File Introduction

| File/Folder | Description |
|--------------|-------------|
| `server.js` | Implements Express server, login/logout, MongoDB CRUD logic, and RESTful API endpoints |
| `package.json` | Lists project dependencies and start script |
| `views/` | Contains EJS files for Login, Ideas list, Edit, etc. |
| `models/idea.js` | Mongoose schema for storing book ideas |
| `public/` | Static CSS/assets folder |
| `README.md` | Project information, usage guide, and deployment link |

---

## Cloud Deployment URL
https://comp3810sef-group17.onrender.com/

---

## Operation Guide


1. **Login/Logout/Registration**
   - Go to `/login` for login and `/register` for registration.
   - Use the following credentials to log in:
     - `student1 / password1`
     - `student2 / 123456`
   - Register a new account through the registration page.
   - Logout by clicking “Logout”.

2. **CRUD Web Pages**
   - `GET /ideas` — List & search ideas
   - Create: Use form to submit new book & idea
   - Update: Click “Edit” to modify your own idea
   - Delete: Click “Delete” to remove your own idea

3. **RESTful API Endpoints (No Authentication)**
   | Method | Endpoint | Description |
   |---------|-----------|-------------|
   | GET | `/api/ideas` | Get all ideas |
   | POST | `/api/ideas` | Create new idea |
   | PUT | `/api/ideas/:id` | Update idea by ID |
   | DELETE | `/api/ideas/:id` | Delete idea by ID |

   **Example test with CURL:**
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"bookName":"1984","idea":"Great dystopian novel"}' https://comp3810sef-group17.onrender.com/api/ideas
