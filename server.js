const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const fsPromises = require('fs').promises;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload()); // Middleware for handling file uploads
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB config
const mongourl = 'mongodb+srv://brian:Brian1221@cluster0.mq6o1ri.mongodb.net/?appName=Cluster0';
const dbName = 'library_dataset';
const collectionName = "bookshelfs";
const userCollection = "users";

let db;
const client = new MongoClient(mongourl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Passport: strategy setup
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await db.collection(userCollection).findOne({ username });
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.collection(userCollection).findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

//cookie-session
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['tHiSiIsasEcRetStr', 'AnoTHeRSeCretStR'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production', 
  httpOnly: true
}));

app.use(passport.initialize()); 
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

//Routes 

app.get('/login', (req, res) => {
  res.status(200).render('login', { message: req.query.message || "" });
});

// Login with local strategy
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/main',
    failureRedirect: '/login?message=Invalid username or password'
  })(req, res, next);
});

app.get('/register', (req, res) => {
  res.status(200).render('register', { message: "" });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.render('register', { message: 'Username and password required.' });
    }
    const existingUser = await db.collection(userCollection).findOne({ username });
    if (existingUser) {
      return res.render('register', { message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword, name: username };
    await db.collection(userCollection).insertOne(newUser);
    res.redirect('/login?message=Registration successful, please log in.');
  } catch (err) {
    console.error(err);
    res.status(500).render('register', { message: 'Server error' });
  }
});

app.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect('/login');
  });
});

const insertDocument = async (db, doc) => await db.collection(collectionName).insertOne(doc);
const findDocument = async (db, c = {}) => await db.collection(collectionName).find(c).toArray();
const updateDocument = async (db, c, update) => await db.collection(collectionName).updateOne(c, { $set: update });
const pushReview = async (db, bookId, review) => db.collection(collectionName).updateOne(
  { _id: bookId }, { $push: { reviews: review } }
);
const deleteDocument = async (db, c) => db.collection(collectionName).deleteMany(c);

// Add routes
app.get('/', isLoggedIn, (req, res) => res.redirect('/main'));
app.get('/main', isLoggedIn, async (req, res) => {
  const docs = await findDocument(db);
  res.status(200).render('main', { nBookshelfs: docs.length, bookshelfs: docs, user: req.user });
});

app.get('/details', isLoggedIn, async (req, res) => {
  let DOCID = { _id: new ObjectId(req.query._id) };
  const docs = await findDocument(db, DOCID);
  res.status(200).render('details', { bookshelfs: docs[0], user: req.user });
});

app.get('/edit', isLoggedIn, async (req, res) => {
  let DOCID = { _id: new ObjectId(req.query._id) };
  let docs = await findDocument(db, DOCID);
  if (docs.length > 0 && docs[0].userid === req.user._id.toString()) {
    res.status(200).render('edit', { bookshelfs: docs[0], user: req.user });
  } else {
    res.status(500).render('info', { message: 'Unable to edit - you are not bookshelf owner!', user: req.user });
  }
});

app.post('/update', isLoggedIn, async (req, res) => {
  const DOCID = { _id: new ObjectId(req.body._id) };
  let updateData = {
    bookname: req.body.bookname,
    author: req.body.author,
  };
  if (req.files && req.files.filetoupload) {
    const file = req.files.filetoupload; // Get the uploaded file
    updateData.photo = Buffer.from(await file.data).toString('base64'); // Use file.data directly
  }
  await updateDocument(db, DOCID, updateData);
  res.status(200).render('info', { message: 'Update successfully.', user: req.user });
});

app.get('/delete', isLoggedIn, async (req, res) => {
  let DOCID = { _id: new ObjectId(req.query._id) };
  let docs = await findDocument(db, DOCID);
  if (docs.length > 0 && docs[0].userid === req.user._id.toString()) {
    await deleteDocument(db, DOCID);
    res.status(200).render('info', { message: `Book name ${docs[0].bookname} removed.`, user: req.user });
  } else {
    res.status(500).render('info', { message: 'Unable to delete - you are not bookshelf owner!', user: req.user });
  }
});

app.post('/addreview', isLoggedIn, async (req, res) => {
  const bookId = new ObjectId(req.body._id);
  const review = {
    userid: req.user._id.toString(),
    username: req.user.name,
    text: req.body.review,
    date: new Date().toISOString()
  };
  await pushReview(db, bookId, review);
  res.redirect(`/details?_id=${req.body._id}`);
});

// Route to create a new book
app.get('/create', isLoggedIn, (req, res) => {
  res.render('create', { user: req.user });
});

app.post('/create', isLoggedIn, async (req, res) => {
  console.log('Received data:', req.body); 

  const bookData = {
    bookname: req.body.bookname,
    author: req.body.author,
    userid: req.user._id.toString(),
  };

  // Check if files were uploaded
  if (req.files && req.files.filetoupload) {
    const file = req.files.filetoupload; 
    console.log('Uploaded file:', file); 

    // Read file buffer directly from the file object
    bookData.photo = Buffer.from(await file.data).toString('base64'); 
  } else {
    console.log('No file uploaded.'); 
  }

  // Insert book data into the database
  await insertDocument(db, bookData);
  res.redirect('/main'); 
});

// Connect to MongoDB once and start server
const port = process.env.PORT || 8099;
client.connect().then(() => {
  db = client.db(dbName);
  app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
});
