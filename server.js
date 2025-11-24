var express = require('express'),
    app = express(),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"),
    formidable = require('express-formidable'),
    session = require('express-session'),
    fsPromises = require('fs').promises;
    path = require('path');

app.set('view engine', 'ejs');
app.use(formidable());

// Facebook Auth Strategy
const facebookAuth = {
    'clientID': '1174030840897887',
    'clientSecret': 'f5aebdd7a0d67c3516a1a04d0d8cfeb9',
    'callbackURL': 'https://project-381-9h99.onrender.com/auth/facebook/callback'
};

var user = {};
passport.serializeUser(function (user, done) { done(null, user); });
passport.deserializeUser(function (id, done) { done(null, user); });

passport.use(new FacebookStrategy({
    "clientID": facebookAuth.clientID,
    "clientSecret": facebookAuth.clientSecret,
    "callbackURL": facebookAuth.callbackURL
},
    function (token, refreshToken, profile, done) {
        console.log("Facebook Profile: " + JSON.stringify(profile));
        user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        };
        return done(null, user);
    })
);

// MongoDB Configuration
const mongourl = 'mongodb+srv://brian:Brian1221@cluster0.mq6o1ri.mongodb.net/?appName=Cluster0';
const dbName = 'library_dataset';
const collectionName = "bookshelfs";
const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Database Helper Functions
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

// Handlers
const handle_Create = async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let newDoc = {
            userid: req.user.id,
            bookname: req.fields.bookname,
            author: req.fields.author,
            reviews: [] // Added field
        };

        if (req.files.filetoupload && req.files.filetoupload.size > 0) {
            const data = await fsPromises.readFile(req.files.filetoupload.path);
            newDoc.photo = Buffer.from(data).toString('base64');
        }

        await insertDocument(db, newDoc);
        res.redirect('/');
    } catch (err) { console.error(err); }
    finally {
        await client.close();
    }
};

const handle_Find = async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const docs = await findDocument(db);
        res.status(200).render('main', { nBookshelfs: docs.length, bookshelfs: docs, user: req.user });
    } catch (err) { console.error(err); }
    finally {
        await client.close();
    }
};

const handle_Details = async (req, res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { _id: ObjectId.createFromHexString(criteria._id) };
        const docs = await findDocument(db, DOCID);
        res.status(200).render('details', { bookshelfs: docs[0], user: req.user });
    } catch (err) { console.error(err); }
    finally {
        await client.close();
    }
};

const handle_Edit = async (req, res, criteria) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { '_id': ObjectId.createFromHexString(criteria._id) };
        let docs = await findDocument(db, DOCID);

        if (docs.length > 0 && docs[0].userid == req.user.id) {
            res.status(200).render('edit', { bookshelfs: docs[0], user: req.user });
        } else {
            res.status(500).render('info', { message: 'Unable to edit - you are not bookshelf owner!', user: req.user });
        }
    } catch (err) { console.error(err); }
    finally {
        await client.close();
    }
};

const handle_Update = async (req, res, criteria) => {
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
        res.status(200).render('info', { message: 'Update sucessfully.', user: req.user });
    } catch (err) { console.error(err); }
    finally {
        await client.close();
    }
};

const handle_Delete = async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        let DOCID = { '_id': ObjectId.createFromHexString(req.query._id) };
        let docs = await findDocument(db, DOCID);
        if (docs.length > 0 && docs[0].userid == req.user.id) {
            await deleteDocument(db, DOCID);
            res.status(200).render('info', { message: `Book name ${docs[0].bookname} removed.`, user: req.user });
        } else {
            res.status(500).render('info', { message: 'Unable to delete - you are not bookshelf owner!', user: req.user });
        }
    } catch (err) { console.error(err); }
    finally { await client.close(); }
};

// New Handler: Add Review
const handle_AddReview = async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const bookId = ObjectId.createFromHexString(req.fields._id);
        const reviewText = req.fields.review;
        const review = {
            userid: req.user.id,
            username: req.user.name,
            text: reviewText,
            date: new Date().toISOString()
        };
        await pushReview(db, bookId, review);
        res.redirect(`/details?_id=${req.fields._id}`);
    } catch (err) { console.error(err); }
    finally { await client.close(); }
};

// Middleware
app.use((req, res, next) => {
    console.log(`TRACE: ${req.path} was requested at ${new Date().toLocaleString()}`);
    next();
});

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get("/login", (req, res) => res.status(200).render('login', { user: req.user }));
app.get("/auth/facebook", passport.authenticate("facebook", { scope: "email" }));
app.get("/auth/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect: "/main",
        failureRedirect: "/"
    })
);

app.get('/', isLoggedIn, (req, res) => res.redirect('/main'));
app.get('/main', isLoggedIn, handle_Find);
app.get('/details', isLoggedIn, (req, res) => handle_Details(req, res, req.query));
app.get('/edit', isLoggedIn, (req, res) => handle_Edit(req, res, req.query));
app.post('/update', isLoggedIn, (req, res) => handle_Update(req, res, req.query));
app.get('/create', isLoggedIn, (req, res) => res.status(200).render('create', { user: req.user }));
app.post('/create', isLoggedIn, handle_Create);
app.get('/delete', isLoggedIn, handle_Delete);

app.post('/addreview', isLoggedIn, handle_AddReview);

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// RESTful API
app.post('/api/library/:bookname', async (req, res) => {
    if (req.params.bookname) {
        await client.connect();
        const db = client.db(dbName);
        let newDoc = {
            bookname: req.fields.bookname,
            author: req.fields.author
        };
        await insertDocument(db, newDoc);
        res.status(200).json({ "Successfully inserted": newDoc }).end();
    } else res.status(500).json({ "error": "missing bookname" });
});

app.get('/api/library/:bookname', async (req, res) => {
    if (req.params.bookname) {
        let criteria = { bookname: req.params.bookname };
        await client.connect();
        const db = client.db(dbName);
        const docs = await findDocument(db, criteria);
        res.status(200).json(docs);
    } else res.status(500).json({ "error": "missing bookname" });
});

app.put('/api/library/:bookname', async (req, res) => {
    if (req.params.bookname) {
        let criteria = { bookname: req.params.bookname };
        let updateData = { author: req.fields.author };
        await client.connect();
        const db = client.db(dbName);
        const results = await updateDocument(db, criteria, updateData);
        res.status(200).json(results).end();
    } else res.status(500).json({ "error": "missing bookname" });
});

app.delete('/api/library/:bookname', async (req, res) => {
    if (req.params.bookname) {
        let criteria = { bookname: req.params.bookname };
        await client.connect();
        const db = client.db(dbName);
        const results = await deleteDocument(db, criteria);
        res.status(200).json(results).end();
    } else res.status(500).json({ "error": "missing bookname" });
});

const port = process.env.PORT || 3000;
const host = '0.0.0.0';
app.listen(port, () => console.log(`Listening at http://${host}:${port}`));
