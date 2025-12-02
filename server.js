const express = require('express');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB configuration
const mongourl = 'mongodb+srv://brian:Brian1221@cluster0.mq6o1ri.mongodb.net/?appName=Cluster0'; 
const dbName = 'library_dataset';
const collectionName = 'bookshelfs';
const userCollection = 'users';

let db;
const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Passport setup
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

// Session middleware
app.use(session({
    name: 'session',
    secret: "tHiSiIsasEcRetStr",
    resave: false,
    saveUninitialized: true,
    cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    secure: false, // set true if using HTTPS
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Utility function to check if the user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login'); // Redirect if not authenticated
};

// ------- Root Route ---------
app.get('/', isLoggedIn, (req, res) => {
    res.redirect('/main'); // Redirect to main page
});

// ------- User Routes ---------
app.get('/login', (req, res) => {
    res.status(200).render('login', { message: req.query.message || "" });
});

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

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// ------- Main Route ---------
app.get('/main', async (req, res) => {
    try {
        const books = await db.collection(collectionName).find({}).toArray();
        const nBookshelfs = books.length;

        res.status(200).render('main', { bookshelfs: books, user: req.user, nBookshelfs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ------- Create Book Route ---------
app.get('/create', isLoggedIn, (req, res) => {
    res.status(200).render('create', { user: req.user });
});

app.post('/create', isLoggedIn, async (req, res) => {
    try {
        const { bookname, author } = req.body;
        const bookData = {
            bookname,
            author,
            photo: req.files && req.files.filetoupload ? Buffer.from(await req.files.filetoupload.data).toString('base64') : null
        };

        await db.collection(collectionName).insertOne(bookData);
        res.redirect('/main');
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// ------- Get Book Details ---------
app.get('/details', async (req, res) => {
    try {
        const bookId = req.query._id;
        const book = await db.collection(collectionName).find({ _id: new ObjectId(bookId) }).toArray();

        if (book.length === 0) {
            return res.status(404).render('info', { message: 'Book not found', user: req.user });
        }
        
        res.status(200).render('details', { book: book[0], user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// ------- Edit Book ---------
app.get('/edit', isLoggedIn, async (req, res) => {
    try {
        const bookId = req.query._id;
        const book = await db.collection(collectionName).find({ _id: new ObjectId(bookId) }).toArray();

        if (book.length === 0) {
            return res.status(404).render('info', { message: 'Book not found', user: req.user });
        }
        res.status(200).render('edit', { book: book[0], user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// ------- Update Book ---------
app.post('/update', isLoggedIn, async (req, res) => {
    try {
        const bookId = req.body._id;
        const { bookname, author } = req.body;
        const updateData = { bookname, author };
        if (req.files && req.files.filetoupload) {
		updateData.photo = req.files.filetoupload.data.toString('base64');
	}
    
        const result = await db.collection(collectionName).updateOne({ _id: new ObjectId(bookId) }, { $set: updateData });

        if (result.matchedCount === 0) {
            return res.status(404).render('info', { message: 'Book not found', user: req.user });
        }
        res.redirect('/main');
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// ------- Delete Book ---------
app.post('/delete', isLoggedIn, async (req, res) => {
    try {
        const bookId = req.body._id; 
        const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(bookId) });

        if (result.deletedCount === 0) {
            return res.status(404).render('info', { message: 'Book not found', user: req.user });
        }
        res.redirect('/main'); 
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// ------- Add Review ---------
app.post('/addreview', isLoggedIn, async (req, res) => {
    try {
        const { _id, review } = req.body; 
        const newReview = {
            username: req.user.username,
            text: review,
            date: new Date()
        };

        const result = await db.collection(collectionName).updateOne(
            { _id: new ObjectId(_id) },
            { $push: { reviews: newReview } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).render('info', { message: 'Book not found', user: req.user });
        }

        res.redirect(`/details?_id=${_id}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('info', { message: 'Server error', user: req.user });
    }
});

// RESTful READ

    app.get('/api/bookshelfs/:bookid', async (req, res) => {
    try {
        const bookId = req.params.bookid; // comes from URL
        const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(bookId) });

        if (!doc) {
            return res.status(404).json({ error: "Book not found" });
        }

        res.status(200).json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Connect to MongoDB and start the server
const port = process.env.PORT || 8099;
client.connect().then(() => {
    db = client.db(dbName);
    app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
}).catch(err => console.error(err));
