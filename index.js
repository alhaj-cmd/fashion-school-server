const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middeware
// app.use(cors());
const corsOptions ={
   origin:'*', 
   credentials:true,
   optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json());

// verifyJwt 
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' })
  }
  // bearer token
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('cors');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4s3yid7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classCollection = client.db('fashiondb').collection('popularClass')
    const instractorCollection = client.db('fashiondb').collection('popularInstractor')
    const addCardCollection = client.db('fashiondb').collection('addCard')
    const usersCollection = client.db('fashiondb').collection('users');

    // jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15d' })
      res.send({ token })


    })


    //  addCart collection 
    app.get('/addCard', verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({ error: true, message: 'Forbiden' })
      }

      const query = { email: email };
      const result = await addCardCollection.find(query).toArray();
      res.send(result);

    })

    app.post('/addCard', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await addCardCollection.insertOne(item);
      res.send(result);
    })

    app.delete('/addCard/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result =  await addCardCollection.deleteOne(query);
      res.send(result);
    })


    const verifyAdmin = async (req, res, next) =>{
      const email =  req.decoded.email;
      const query =  {email:email}
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({ error: true, message: 'Forbiden' })
      }
      next();
    }


    
    // user api

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      console.log(result);
      res.send(result);
    })

    // user admin
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already existing' })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result);
    })

    //  admin email
    app.get('/users/admin/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin:false})
      }

      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin: user?.role==='admin'}
      res.send(result);
    })

    // instractor email
    app.get('/users/instractor/:email', verifyJWT, async(req, res) =>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({instractor:false})
      }

      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {instractor: user?.role==='instractor'}
      res.send(result);
    })


    // admin 
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    //instractor
    app.patch('/users/instractor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instractor',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    // Popular class api

    app.get('/student', async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result);
    })

    // Popular Instractor
    app.get('/instractor', async (req, res) => {
      const result = await instractorCollection.find().toArray()

      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('fashion school running')
})


app.listen(port, () => {
  console.log(`Fashion school server start ${port}`)
})
