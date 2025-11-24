var express = require('express'),
    app = express(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"),
    formidable = require('express-formidable'),
    session = require('express-session'),
    bcrypt = require('bcrypt'),
    fsPromises = require('fs').promises,
    path = require('path');

app.set('view engine', 'ejs');
app.use(formidable());
app.use(express.urlencoded({ extended: true }));

// MongoDB Config
const mongourl = 'mongodb+srv://brian:Brian1221@cluster0.mq6o1ri.mongodb.net/?appName=Cluster0';
const dbName = 'library_dataset';
const collectionName = "bookshelfs";
const userCollection = "users";
const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Passport setup for local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const user = await db.collection(userCollection).findOne({ username: username });
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
    } catch (err) {
        return done(err);
    } finally {
        await client.close();
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const user = await db.collection(userCollection).findOne({ _id: new ObjectId(id) });
        done(null, user);
    } catch (err) {
        done(err);
    } finally {
        await client.close();
    }
});

// Middleware & Sessions
app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Utility DB Functions (reuse from your code)
const insertDocument = async (db, doc) => {
    var collection = db.collection(collectionName);
    let results = await collection.insertOne(doc);
    console.log("insert one document:" + JSON.stringify(results));
    return results;
};

const findDocument = async (db, criteria = {}) => {
    var collection = db.collection(collectionName);
    let results = await collection.find(criteria).toArray();
    console.log("find the documents:" + JSON.stringify(results));
    return results;
};

const updateDocument = async (db, criteria, updateData) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(criteria, { $set: updateData });
    console.log("update one document:" + JSON.stringify(results));
    return results;
};

const pushReview = async (db, bookId, review) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(
        { _id: bookId },
        { $push: { reviews: review } }
    );
    console.log("pushed review:" + JSON.stringify(results));
    return results;
};

const deleteDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.deleteMany(criteria);
    console.log("delete one document:" + JSON.stringify(results));
    return results;
};

// Middleware for protecting routes
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Routes

// Render login page
app.get('/login', (req, res) => {
    res.status(200).render('login', { message: req.query.message || "" });
});

// Handle login POST using passport local
app.post('/login', passport.authenticate('local', {
    successRedirect: '/main',
    failureRedirect: '/login?message=Invalid username or password'
}));

// Render registration page
app.get('/register', (req, res) => {
    res.status(200).render('register', { message: "" });
});

// Handle registration POST
app.post('/register', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const existingUser = await db.collection(userCollection).findOne({ username: req.fields.username });
        if (existingUser) {
            return res.status(400).render('register', { message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(req.fields.password, 10);
        const newUser = { username: req.fields.username, password: hashedPassword, name: req.fields.username };
        await db.collection(userCollection).insertOne(newUser);
        res.redirect('/login?message=Registration successful, please log in.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    } finally {
        await client.close();
    }
});

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Book-related routes must be protected with isLoggedIn
app.get('/', isLoggedIn, (req, res) => res.redirect('/main'));
app.get('/main', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const docs = await findDocument(db);
        res.status(200).render('main', { nBookshelfs: docs.length, bookshelfs: docs, user: req.user });
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

app.get('/details', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { _id: ObjectId.createFromHexString(req.query._id) };
        const docs = await findDocument(db, DOCID);
        res.status(200).render('details', { bookshelfs: docs[0], user: req.user });
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

app.get('/edit', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { '_id': ObjectId.createFromHexString(req.query._id) };
        let docs = await findDocument(db, DOCID);
        if (docs.length > 0 && docs[0].userid == req.user._id.toString()) {
            res.status(200).render('edit', { bookshelfs: docs[0], user: req.user });
        } else {
            res.status(500).render('info', { message: 'Unable to edit - you are not bookshelf owner!', user: req.user });
        }
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

app.post('/update', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const DOCID = {
            _id: ObjectId.createFromHexString(req.fields._id)
        };
        let updateData = {
            bookname: req.fields.bookname,
            author: req.fields.author,
        };
        if (req.files.filetoupload && req.files.filetoupload.size > 0) {
            const data = await fsPromises.readFile(req.files.filetoupload.path);
            updateData.photo = Buffer.from(data).toString('base64');
        }
        const results = await updateDocument(db, DOCID, updateData);
        res.status(200).render('info', { message: 'Update successfully.', user: req.user });
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

app.get('/delete', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { '_id': ObjectId.createFromHexString(req.query._id) };
        let docs = await findDocument(db, DOCID);
        if (docs.length > 0 && docs[0].userid == req.user._id.toString()) {
            await deleteDocument(db, DOCID);
            res.status(200).render('info', { message: `Book name ${docs[0].bookname} removed.`, user: req.user });
        } else {
            res.status(500).render('info', { message: 'Unable to delete - you are not bookshelf owner!', user: req.user });
        }
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

app.post('/addreview', isLoggedIn, async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const bookId = ObjectId.createFromHexString(req.fields._id);
        const reviewText = req.fields.review;
        const review = {
            userid: req.user._id.toString(),
            username: req.user.name,
            text: reviewText,
            date: new Date().toISOString()
        };
        await pushReview(db, bookId, review);
        res.redirect(`/details?_id=${req.fields._id}`);
    } catch (err) { console.error(err); }
    finally { await client.close(); }
});

const port = process.env.PORT || 8099;
app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
