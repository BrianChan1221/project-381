# &#128218;Bookcase&#128218; WEB APP

## Group Info
- **Course Code**: COMP3810SEF/COMP381F
- **Group No**: 17
- **Members**: Chan Hoi Lun 12960272
            \nChan Man Tik 13138272
            Chan King Yin13130121
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
   - Register a new account through the registration page.
   - Logout by clicking “Logout”.

2. **CRUD Web Pages**
   - GET: List & search bookcases
   - Create: Use form to submit new bookcase
   - Update: Click “Edit” to modify your own bookcases
   - Delete: Click “Delete” to remove your own bookcase

3. **RESTful API**
   | Method | Endpoint | Description |
   |---------|-----------|-------------|
   | GET | `/api/library/:bookname` | Get all bookcases |
   | POST | `/api/library/:bookname` | Create new bookcase |
   | PUT | `/api/library/:bookname` | Update bookcase by ID |
   | DELETE | `/api/library/:bookname` | Delete bookcase by ID |

   **Example test with CURL:**
   \\curl -X POST -H "Content-Type: application/json" -d '{"bookName":"1984","idea":"Great dystopian novel"}' https://comp3810sef-group17.onrender.com/api/ideas
