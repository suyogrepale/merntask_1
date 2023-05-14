const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost/mydb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Defined schema and model for storing form data in database
const FormSchema = new mongoose.Schema({
  name: { type: String },
  age: { type: Number },
  phone: { type: String },
  address: { type: String },
  voted: { type: Boolean }
});

const FormModel = mongoose.model('Form', FormSchema);

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/not_eligible', (req, res) => {
    res.sendFile(__dirname + '/not_eligible.html');
});
  
app.get('/eligible', (req, res) => {
    res.sendFile(__dirname + '/voting.html');
});

app.get('/analytics', (req, res) => {
    res.sendFile(__dirname + '/analytics.html');
});

app.post('/submit-form', (req, res) => {
  const form = new FormModel({
    name: req.body.name,
    age: req.body.Age,
    phone: req.body.Phone,
    address: req.body.Address,
    voted: false
  });

  form.save()
    .then(() => {
      console.log('Form data saved to database');
      if(req.body.Age<18){
        res.redirect('/not_eligible');
      }else{
        res.redirect('/eligible');
      }
    })
    .catch(err => console.log(err));
});

app.post('/vote', (req, res) => {
  const candidate = req.body.candidate;

  FormModel.findOneAndUpdate(
    { voted: false },
    { voted: true, candidate: candidate },
    { new: true }
  )
  .then((doc) => {
    console.log('Voting data updated in database');
    res.redirect('/thankyou');
  })
  .catch(err => console.log(err));
});

app.get('/thankyou', (req, res) => {
  res.sendFile(__dirname + '/thankyou.html');
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
