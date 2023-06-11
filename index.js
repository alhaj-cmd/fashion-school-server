const express = require('express');
const app = express();
const cors =  require('cors');
require('dotenv').config();
const jwt = require ('jsonwebtoken');
const port =  process.env.PORT || 5000;

// middeware
app.use(cors());
app.use(express.json());

// verifyJwt 
const verifyJwt = (req, res, next) =>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message:'unauthorized access'})
  }
  // bearer token
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({error:true, message:'unauthorized'})
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
    const usersCollection = client.db('fashiondb').collection('users');

    // jwt
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15d'})
      res.send({token})


    })

    // user api

    app.get('/users', async(req, res ) =>{
      const result = await usersCollection.find().toArray();
      console.log(result);
      res.send(result);
    })

//  users collection

app.post('/addCart', async(req, res) =>{
  const item = req.body;
  console.log(item);
  const result = await usersCollection.insertOne(item);
  res.send(result);
})

// user admin
    app.post('/users', async(req, res) =>{
      const user =  req.body;
      const query = {email: user.email}
      const existingUser = await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already existing'})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result);
    } )

// admin 
    app.patch('/users/admin/:id', async (req, res) =>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    //instractor
    app.patch('/users/instractor/:id', async (req, res) =>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instractor',
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    // Popular class api

    app.get('/student', async(req, res)=>{
        const result = await classCollection.find().toArray()
        res.send(result);
    })

    // Popular Instractor
    app.get('/instractor', async(req, res)=>{
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
