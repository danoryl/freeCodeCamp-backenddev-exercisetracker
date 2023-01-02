const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser'); // parse POST body
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// MOUNT BODYPARSER
app.use('/', bodyParser.urlencoded({extended: false}));

// MONGODB CONNECT
const myURI = process.env['MONGO_URI']
mongoose.connect(myURI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
         console.error('Database connection error')
       });

// Create Mongo Schemas and models 
const userSchema = new mongoose.Schema({
  username: String,
  
}, { versionKey: false });

const User = mongoose.model('User', userSchema);

const excerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
}, { versionKey: false })

const Excercise = mongoose.model('Excercise', excerciseSchema);

// ADD A NEW USER IF NOT ALREADY IN DB
app.post('/api/users/', async function (req, res) {
  let username = req.body.username;
  let foundUser = await User.findOne({
        username: username
      })
  if (foundUser) {
         
     res.json({
          username: foundUser.username,
          _id: foundUser._id
        })
    } else {
    userToAdd = new User({
          username: username
          
        })
    await userToAdd.save()
    res.json({
      username: userToAdd.username,
      _id: userToAdd._id
       })
     }
    
  

})

// LIST ALL USERS
app.get('/api/users/', async function (req, res) {
  let allUsers = await User.find();
  res.json(allUsers)

})

// ADD AN EXCERCISE
app.post('/api/users/:_id/exercises', async function (req, res) {
  
  let id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  if (date == "" || date == undefined) {
    date = new Date().toISOString().substring(0,10);
   }
  try {
    let foundUser = await User.findById(id)
    if (foundUser) {
      excToAdd = new Excercise({
          username: foundUser.username,
          date: date,
          description: description,
          duration: duration
          
          
        })
    await excToAdd.save()
    let dateoutput = new Date(excToAdd.date).toDateString()
    res.json({
          _id: id,
          username: excToAdd.username,
          date: dateoutput,
          description: excToAdd.description,
          duration: excToAdd.duration
        })
    }
     
  } catch(err) {
  res.json({
      error: 'User not found'
    }) 
}
  
})

app.get('/api/users/:_id/logs', async function (req, res) {
  
  let id = req.params._id;
  try {
    let foundUser = await User.findById(id)
    if (foundUser) {
      let username = foundUser.username;
    let log = await Excercise.find({username: username});
    let limit = Infinity;
    let dateFrom = new Date(0);
    let dateTo = new Date();
    let logFiltered = [];
    req.query.limit == undefined ? limit = Infinity : limit = req.query.limit;
    req.query.from == undefined ? dateFrom = dateFrom : dateFrom = new Date(req.query.from);
    req.query.to == undefined ? dateTo = dateTo : dateTo = new Date(req.query.to);
    let i = 0;
    if (Object.keys(log).length === 0) {
      res.json({
      _id: id,
      username: username,
      count: 0,
      log: []
      })
    }
    else {
      for (exc of log) {
      let date = new Date(exc.date);
      if (date >= dateFrom && date <= dateTo) {
        logFiltered.push({description: exc.description, duration: exc.duration, date: date.toDateString() })
      i++;  
      }
      if (i == limit) { break }
    }
      
    res.json({
      _id: id,
      username: username,
      count: logFiltered.length,
      log: logFiltered
      })
          
    }
    
  } else {
      res.json({
      error: 'User not found'
      }) 
    }
    
  } catch(err) {
    console.log(err);
  res.json({
      error: 'User not found'
    }) 
  } 
  
    
  
 

}) 


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
