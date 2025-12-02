# &#128218;Bookcase&#128218; WEB APP

## Group Info
- **Course Code**: COMP3810SEF/COMP381F
- **Group No**: 17
- **Members**: Chan Hoi Lun 12960272 Chan Man Tik 13138272 Chan King Yin13130121
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
   - Log out by clicking “Logout”.

2. **CRUD Web Pages**
   - GET: List & search bookcases
   - Create: Click "Create a New Bookcase" to create a bookcase
   - Update: Click the book name you created, then click “Edit” to modify the details of your bookcases(you are not able to edit other users' bookcases), also you can add review in bookcases.
   - Delete: Click the book name you created, then click “Delete” to remove your bookcase

3. **RESTful API**
   | Operation | HTTP Method | Path URI | Description |
   |---------|---------|-----------|-------------|
   | Read | GET | `/api/bookshelfs/:bookid` | Get the bookcase by bookid |
   | Create | POST | `/api/bookshelfs/:bookid` | Create new bookcase |
   | Update | PUT | `/api/bookshelfs/:bookid` | Update bookcase by bookid |
   | Delete | DELETE | `/api/bookshelfs/:bookid` | Delete bookcase by bookid |

   **Example test with RESTful CURL services:**
   - READ: -curl -X GET https://project-381-9h99.onrender.com/api/bookshelfs/69249bd0fa03d0e6297b47ee
   - CREATE: -curl -X POST -H "Content-Type: application/json" --data '{"bookname":"testingcreate3","author":"testingcreate3"}' localhost:8099/api/bookshelfs/
   - UPDATE: -curl -X PUT -H "Content-Type: application/json" --data '{"bookname":"testingupdate3","author":"testingupdate3"}' localhost:8099/api/bookshelfs/692edf0ae6bff7a8edb4e142
   - DELETE: -curl -X DELETE localhost:8099/api/bookshelfs/692edf0ae6bff7a8edb4e142
