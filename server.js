var express             = require('express'),
    app                 = express(),
	passport			= require('passport'),
	FacebookStrategy    = require('passport-facebook').Strategy,
	{ MongoClient, ServerApiVersion } = require("mongodb"),	
	formidable 			= require('express-formidable'),
	session				= require('express-fomidable'),
	fsPromises 			= require('fs').promises;


app.set('view engine', 'ejs');
app.use(formidable());

// FacebookAuth strategy
const facebookAuth = {
	'clientID'        : '', 
	'clientSecret'    : '', 
	'callbackURL'     : ''
};

/*login or logout*/


/*end of login logout*/

/*facebook strategy*/


/*end of facebook strategy*/

/*Below is MongoDB settings*/
const mongourl = '';
const dbName = 'library_dataset';
const collectionName = "bookshelf";
const client = new MongoClient(mongourl, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const insertDocument = async (db, doc) => {
    var collection = db.collection(collectionName);
    let results = await collection.insertOne(doc);
	console.log("insert one document:" + JSON.stringify(results));
    return results;
}

const findDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.find(criteria).toArray();
	console.log("find the documents:" + JSON.stringify(results));
    return results;
}
const updateDocument = async (db, criteria, updateData) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(criteria, { $set: updateData });
	console.log("update one document:" + JSON.stringify(results));
    return results;
}
const deleteDocument = async (db, criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.deleteMany(criteria);
	console.log("delete one document:" + JSON.stringify(results));
    return results;
}

/*handle function*/

/*End of MongoDB settings*/

/*Middleware*/











/*End of Middleware*/

/* RESTful(WRONG!!!) */
app.post('/api/booking/:bookingid', async (req,res) => { 
	if (req.params.bookingid) {
	console.log(req.body)
	await client.connect();
	console.log("Connected successfully to server");
	const db = client.db(dbName);
	let newDoc = {
		bookingid: req.fields.bookingid,
		mobile: req.fields.mobile};
	await insertDocument(db, newDoc);
	res.status(200).json({"Successfully inserted":newDoc}).end();
	} else {
	res.status(500).json({"error": "missing bookingid"});
	}
})
app.get('/api/booking/:bookingid', async (req,res) => { 
	if (req.params.bookingid) {
	console.log(req.body)
	let criteria = {};
	criteria['bookingid'] = req.params.bookingid;
	await client.connect();
	console.log("Connected successfully to server");
	const db = client.db(dbName);
	const docs = await findDocument(db, criteria);
	res.status(200).json(docs);
	} else {
	res.status(500).json({"error": "missing bookingid"}).end();
	}
});

app.put('/api/booking/:bookingid', async (req,res) => {
	if (req.params.bookingid) {
	console.log(req.body)

	let criteria = { bookingid: req.params.bookingid }; 
        let updateData = {
            mobile: req.fields.mobile 
        };

        await client.connect();
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const results = await updateDocument(db, criteria, updateData);

	res.status(200).json(results).end();
	} else {
	res.status(500).json({"error": "missing bookingid"});
	}
})

app.delete('/api/booking/:bookingid', async (req,res) => {
	if (req.params.bookingid) {
	console.log(req.body)

	let criteria = { bookingid: req.params.bookingid }; 

        await client.connect();
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        const results = await deleteDocument(db, criteria); 
        
	console.log(results)
	res.status(200).json(results).end();
	} else {
	res.status(500).json({"error": "missing bookingid"});
	}
})
/* End of Restful */

app.get('/api/booking/:bookingid', async (req,res) => {
	res.status(200).type('json').json(users).end();
});

const port = process.env.PORT || 8099;
app.listen(port, () => {console.log(`Listening at http://localhost:${port}`);});
