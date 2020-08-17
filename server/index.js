require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const passport = require('passport');
const cookieSession = require('cookie-session');
const flash = require('connect-flash');
const sequelize = require('./db/db.js');
require('./passport/passport');
// const data = require('../data.json');
const {
  addUser, getUsers, getDogs,
  addFriend, isAccCreated,
  addDog, addLoc, getLocs, getFriends,
  getCurrentDog, getUser, updateDog,
} = require('./queries.js');

const PORT = process.env.PORT || 3000;
const CLIENT_PATH = path.join(__dirname, '../client/dist');

const app = express();

/* Middleware================================================================== */

app.use(express.json());
app.use(cors());
app.use(express.static(CLIENT_PATH));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  secure: false,
}));
app.use(flash());

/* ============================================================================ */

/* Routes====================================================================== */
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const { googleId } = req.user;
    isAccCreated(googleId)
      .then((acc) => {
        if (acc) {
          res.redirect('/');
        } else {
          res.redirect('/signUp');
        }
      })
      .catch((err) => res.status(500).send(err));
  });

app.get('/dogs', (req, res) => {
  getDogs()
    .then((list) => res.status(200).send(list))
    .catch((err) => res.status(500).send(err));
});

app.get('/myProfileInfo', (req, res) => {
  const userId = req.session.passport.user.id;
  getUser(userId)
    .then((list) => res.send(list))
    .catch((err) => res.sendStatus(500));
});

app.post('/dogs', (req, res) => {
  const dogInfo = req.body;
  addDog(dogInfo)
    .then(() => res.sendStatus(201))
    .catch((err) => res.status(500).send(err));
});

app.post('/updateUserAndDog', (req, res) => {
  const userEditObj = req.body.user;
  const dogEditObj = req.body.dog;
  console.log('dogObj: ', dogEditObj);
  const userId = req.session.passport.user.id;
  const updateUserObj = null;
  addUser(userId, userEditObj)
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
  updateDog(userId, dogEditObj).then((result) => {
    res.send({ user: updateUserObj, dog: result.data });
  })
    .catch((err) => console.log(err));
});

app.get('/currentDog', (req, res) => {
  const userId = req.session.passport.user.id;
  getCurrentDog(userId)
    .then((dog) => res.status(200).send(dog))
    .catch((err) => res.sendStatus(500));
});

app.get('/users', (req, res) => {
  getUsers()
    .then((list) => res.status(200).send(list))
    .catch((err) => res.sendStatus(500));
});

app.post('/users', (req, res) => {
  const userInfoObj = req.body;
  const userId = req.session.passport.user.id;
  addUser(userId, userInfoObj)
    .then(() => res.sendStatus(201).redirect('/'))
    .catch((err) => res.sendStatus(500));
});

app.post('/dogFriends', (req, res) => {
  const { doggyId } = req.body;
  console.log('/dogFriends', req.body);
  getFriends(doggyId)
    .then((list) => res.status(200).send(list))
    .catch((err) => res.sendStatus(500));
});

app.post('/friends', (req, res) => {
  const friendObj = {
    dogId: req.session.passport.dog,
    friendId: req.body,
    bool_friend: 1,
  };
  addFriend(friendObj)
    .then(() => res.sendStatus(201))
    .catch((err) => res.sendStatus(500));
});

// app.post('/unfriend', (req, res) => {
//   const dogId = req.session.passport.dog;
//   const friendId = req.body;
//   const bool = 0;
//   unFriend(dogId, friendId, bool)
//     .then(() => res.sendStatus(201))
//     .catch((err) => res.sendStatus(500));
// });

app.get('/loc', (req, res) => {
  getLocs()
    .then((list) => res.status(200).send(list))
    .catch((err) => res.sendStatus(500));
});

app.post('/loc', (req, res) => {
  const locObj = req.body;
  addLoc(locObj)
    .then(() => res.sendStatus(201))
    .catch((err) => res.sendStatus(500));
});

app.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/login');
});

app.get('/session', (req, res) => {
  res.send(req.session.passport.user);
});

app.get('*', (req, res) => {
  res.sendFile(`${CLIENT_PATH}/index.html`);
});

/* ============================================================================ */

/* Starting server */
app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
