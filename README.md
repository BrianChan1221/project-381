# Library Ideas Web App

## Group Info
- **Course Code**: COMP3810SEF/COMP381F
- **Group No**: 17
- **Members**: Chan Hoi Lun 12960272
-               Chan Man Tik 13138272
-               Chan King Yin 13130121
---

## Project File Introduction

| File/Folder | Description |
|--------------|-------------|
| `server.js` | Implements Express server, login/logout, MongoDB CRUD logic, and RESTful API endpoints |
| `package.json` | Lists project dependencies and start script |
| `views/` | Contains EJS files for login, main, info, edit, etc. |
| `public/` | Static CSS/assets folder |
| `README.md` | Project information, usage guide and deployment link |

---

## Cloud Deployment URL
https://project-381-9h99.onrender.com

---

## Operation Guide


1. **Login/Logout/Registration**
   - Go to '/login' for login and `/register` for registration.
   - Use the following credentials to log in:
     - `student1 / password1`
     - 'student2 / 123456'
   - Register a new account through the registration page.
   - Logout by clicking “Logout”.

2. **CRUD Web Pages**
   - `GET /ideas` — List & search ideas
   - Create: Use form to submit new book & idea
   - Update: Click “Edit” to modify your own idea
   - Delete: Click “Delete” to remove your own idea

3. **RESTful API**
   | Method | Endpoint | Description |
   |---------|-----------|-------------|
   | GET | `/api/library/:bookname` | Get all ideas |
   | POST | `/api/library/:bookname` | Create new idea |
   | PUT | `/api/library/:bookname` | Update idea by ID |
   | DELETE | `/api/library/:bookname` | Delete idea by ID |

   **Example test with CURL:**
   \\curl -X POST -H "Content-Type: application/json" -d '{"bookName":"1984","idea":"Great dystopian novel"}' https://comp3810sef-group17.onrender.com/api/ideas
