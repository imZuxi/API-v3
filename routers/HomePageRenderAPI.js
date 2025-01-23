const express = require('express');
const home = express.Router()
const path = require('path')
const { GetUserFromToken } = require('../helpers/tokens');
const { MakeSQLRequest } = require('../helpers/database');
home.get("/oldhomepage", (req, res) => {


  try {
    getRandomQuote(quotes, (randomQuote) => {
      getRandomQuote(toptext, (RandomTopTxt) => {
        getRandomVideo((video) => {

          GetUserFromToken(req.cookies.auth, 'web', (err, user) => {
            if (user) {
              randomQuote = `Hello ${user.username}!`
            }
            res.render((path.join(__dirname, '../views/home.ejs')), {
              quote: randomQuote,
              toptxt: RandomTopTxt,
              video: video
            })
          })
        })

      })
    });
  }
  catch (error) {
    res.sendFile((path.join(__dirname, '../../Zuxi/index.html')))
    throw error;
  }
})

home.get("/getonetimeinfo", (req, res) => {
  let data = {
    header: "Developer and DJ Redefining the Future. one day at a time.",
    pfp: "https://cdn.imzuxi.com/users/avatars/0.png"
  }
  try {

    GetUserFromToken(req.cookies.auth, 'web', (err, user) => {
      if (user) {
        data.header = `Developer and DJ Redefining the Future. one day at a time. <br> Hello ${user.username}!`
      }

      MakeSQLRequest("SELECT image FROM users where uid = 0", (err, resl) => {
        data.pfp = resl[0].image;
      })
      res.json(data)
    });
  }
  catch (error) {
    res.sendFile((path.join(__dirname, '../../Zuxi/index.html')))
    throw error;
  }
})

function getRandomVideo(res) {
  // Ensure that the first index (index 0) is selected more often
  const weightedQuotes = ['Mika', '7ifgverj', ''];

  // Calculate the total weight (count of quotes)
  const totalWeight = weightedQuotes.length;

  // Generate a random index
  const randomIndex = Math.floor(Math.random() * totalWeight);

  // Return the selected quote
  res(weightedQuotes[randomIndex]);
}

function getRandomQuote(quotes, res) {
  // Ensure that the first index (index 0) is selected more often
  const weightedQuotes = [quotes[0], ...quotes];

  // Calculate the total weight (count of quotes)
  const totalWeight = weightedQuotes.length;

  // Generate a random index
  const randomIndex = Math.floor(Math.random() * totalWeight);

  // Return the selected quote
  res(weightedQuotes[randomIndex]);
}

// Example usage:
const quotes = [
  //  "Redefining the Future",
  // "ignorance is bliss",
  // "im not Zuxi :<",
  "Happy New Year! From Zuxi :P"
];

const toptext = [
  "Im Zuxi",
  "!Zuxi"
]

module.exports = home
