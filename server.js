// ======================================================
// Library Ideas Web App - Group 17
// ======================================================

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const Idea = require('./models/idea');

const app = express();

// ===== MongoDB Connection =====
const mongourl = 'mongodb+srv://s1313012:1313012@cluster0.pdbahws.mongodb.net/?appName=Cluster0';
mongoose.connect(mongourl)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

// ===== Middleware =====
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'libraryappsecret',
  resave: false,
  saveUninitialized: true
}));

// ===== Temporary User Database =====
const users = [
  { username: 'student1', passwordHash: bcrypt.hashSync('password1', 10) },
  { username: 'student2', passwordHash: bcrypt.hashSync('123456', 10) }
];

// ===== Authentication Middleware =====
function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/login');
}

// ===== Routes =====

// Home
app.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});

// Login Page
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    req.session.user = username;
    res.redirect('/ideas');
  } else {
    res.render('login', { error: 'Invalid Credentials' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Registration Page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Handle Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(u => u.username === username);
  
  if (existingUser) {
    return res.render('register', { error: 'Username already taken.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash: hashedPassword });
  res.redirect('/login');
});

// ===== CRUD Web Pages =====

// Read/Search
app.get('/ideas', isAuthenticated, async (req, res) => {
  const q = req.query.q;
  const filter = q ? { bookName: new RegExp(q, 'i') } : {};
  const ideas = await Idea.find(filter);
  res.render('ideas', { ideas, user: req.session.user, search: q || '' });
});

// Create
app.post('/ideas', isAuthenticated, async (req, res) => {
  await Idea.create({
    bookName: req.body.bookName,
    idea: req.body.idea,
    user: req.session.user
  });
  res.redirect('/ideas');
});

// Edit Page
app.get('/ideas/:id/edit', isAuthenticated, async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (idea.user !== req.session.user) return res.status(403).send("Access denied!");
  res.render('edit', { idea });
});

// Update
app.post('/ideas/:id/edit', isAuthenticated, async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (idea.user !== req.session.user) return res.status(403).send("Unauthorized");
  idea.bookName = req.body.bookName;
  idea.idea = req.body.idea;
  await idea.save();
  res.redirect('/ideas');
});

// Delete
app.get('/ideas/:id/delete', isAuthenticated, async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (idea.user === req.session.user) {
    await Idea.findByIdAndDelete(req.params.id);
  }
  res.redirect('/ideas');
});

// ===== RESTful APIs =====
app.get('/api/ideas', async (req, res) => res.json(await Idea.find({})));
app.post('/api/ideas', async (req, res) => res.json(await Idea.create(req.body)));
app.put('/api/ideas/:id', async (req, res) => res.json(await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/ideas/:id', async (req, res) => res.json(await Idea.findByIdAndDelete(req.params.id)));

// ===== Server Start =====
const port = process.env.PORT || 8099;
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
