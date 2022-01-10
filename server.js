const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
require('dotenv').config();

const {User, Exercise} = require('./models/User');

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const URI = 'mongodb+srv://root:12345@cluster0.dsrte.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('Connected'))
.catch((e)=>console.log(e));


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.post('/api/users', async (req, res) => {
  let { username } = req.body;

  const newUser = new User({
    username
  });

  await newUser.save((e, result)=> {
    e ? console.log(e) : console.log('Saved');
  });

  res.json(newUser);

});

app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.json(users)
});

app.post('/api/users/:_id/exercises', async (req, res)=> {
  const {_id } = req.params;
  let { description, duration, date } = req.body;

  if(date === null || date === undefined || date === ""){
    date = new Date()
  }
  date = new Date(date)
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  date = date.toDateString()

  const newExercise = new Exercise({
    description,
    duration,
    date
  })

  User.findByIdAndUpdate(_id, {
    $push: {log: newExercise}
  }, {new: true}, (e, user) => {
    if(!e){
      const response = {
        _id: user._id,
        username: user.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date
      }
      res.json(response)
    }
  })

});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const user = await User.findById(_id);

  let fromDate = req.query.from ? new Date(req.query.from).getTime() : new Date(0).getTime();
  let toDate = req.query.to ? new Date(req.query.to).getTime() : new Date().getTime();

  let auxLog = user.log.filter((exercise) => {
    let exerciseDate = new Date(exercise.date).getTime();
    return exerciseDate >= fromDate && exerciseDate <= toDate;
  })

  if(req.query.limit){
    auxLog = auxLog.slice(0, req.query.limit)
  }

  const response = {
    user,
    log: auxLog,
    count: user.log.length
  }
  res.json(response);
})
