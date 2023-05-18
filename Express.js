const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Set EJS as the default view engine
app.set('view engine', 'ejs');

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
  phone: { type: String, unique: true }, // Add unique constraint
  address: { type: String },
  voted: { type: Boolean }
});


const FormModel = mongoose.model('Form', FormSchema);

// Candidate schema and model for storing candidate information
const CandidateSchema = new mongoose.Schema({
  name: { type: String },
  votes_count: { type: Number, default: 0 }
});

const CandidateModel = mongoose.model('Candidate', CandidateSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/not_eligible', (req, res) => {
  res.sendFile(__dirname + '/not_eligible.html');
});
  
app.get('/vote', (req, res) => {
  const phone = req.query.phone;

  FormModel.findOne({ phone: phone })
    .then((form) => {
      if (!form) {
        console.log('Invalid phone number');
        res.redirect('/already_voted'); // Redirect to a page indicating invalid phone number
      } else if (form.voted) {
        console.log('Candidate has already voted');
        res.redirect('/already_voted'); // Redirect to a page indicating they have already voted
      } else {
        res.sendFile(__dirname + '/voting.html');
      }
    })
    .catch(err => console.log(err));
});


app.get('/phone_duplicate', (req, res) => {
  res.send("Duplicate Phone Number");
});

app.get('/already_voted', (req, res) => {
  res.send("You has already voted or invalid phone number, Don't try to act Fishy");
});

app.get('/thankyou', (req, res) => {
  res.sendFile(__dirname + '/thankyou.html');
});

app.get('/analytics', (req, res) => {
  CandidateModel.find({})
    .then((candidates) => {
      const candidateCounts = candidates.map(candidate => ({
        name: candidate.name,
        votes_count: candidate.votes_count
      }));

      res.render('analytics', { candidates: candidateCounts });
    })
    .catch((err) => {
      console.log(err);
      res.render('analytics', { candidates: [] });
    });
});


app.post('/submit-form', async (req, res) => {
  try {
    const form = new FormModel({
      name: req.body.name,
      age: req.body.Age,
      phone: req.body.Phone,
      address: req.body.Address,
      voted: false
    });

    await form.save();

    console.log('Form data saved to database');

    if (req.body.Age < 18) {
      res.redirect('/not_eligible');
    } else if (form.voted) {
      res.redirect('/already_voted');
    } else {
      res.redirect('/vote?phone=' + form.phone);
    }
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate phone number error
      console.log('Candidate with the same phone number already exists');
      FormModel.findOne({ phone: req.body.Phone })
        .then((form) => {
          if (form && form.voted) {
            res.redirect('/already_voted');
          } else {
            res.redirect('/vote?phone=' + req.body.Phone);
          }
        })
        .catch(err => {
          console.log(err);
          res.redirect('/error');
        });
    } else {
      console.log(err);
      res.redirect('/error'); // Handle other errors
    }
  }
});


app.post('/vote', (req, res) => {
  const candidate = req.body.candidate;

  FormModel.findOneAndUpdate(
    { voted: false },
    { voted: true, candidate: candidate },
    { new: true }
  )
    .then((form) => {
      if (!form) {
        console.log('Candidate has already voted');
        res.redirect('/already_voted'); // Redirect to a page indicating they have already voted
      } else {
        console.log('Voting data updated in database');

        CandidateModel.findOneAndUpdate(
          { name: candidate },
          { $inc: { votes_count: 1 } },
          { new: true }
        )
          .then((candidate) => {
            console.log('Candidate vote count updated:', candidate);

            // Save the form data after voting
            form.save()
              .then(() => {
                console.log('Form data saved with vote');
                res.redirect('/thankyou');
              })
              .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
      }
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
