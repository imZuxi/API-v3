const express = require('express');
const RandomAPI = express.Router()
const path = require('path')
RandomAPI.get("/video", (req, res) => {
    const isRawRequested = 'raw' in req.query;;

    const weightedQuotes = [
      //  "9940cc1d", // Ori DE Silent.mp4
      //  "897cd04e", //玲宝2(2)_2.mp4
       // "9c50f5a7", // Beach1.mp4
       // "6dca0605", // Fae.mp4
        "8809adb2", // Turn it up.mp4
      //  "6e9d8259", // Zuxi Vid.mp4
        "aed6572c", // Loading Vid.mp4
       // "b3804cf1", // Mika.mp4
        "4b125683", // Obiltiterate.mp4
       // "fcb61c4d" // 7ifgverj.mp4
    ];
    //https://cute.bet/api/v7/random/video?raw=true
    // Calculate the total weight (count of quotes)
    const totalWeight = weightedQuotes.length;

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * totalWeight);

    // Return the selected quote

    if (isRawRequested) {
        return res.redirect("https://cdn.cute.bet/assets/media/" + weightedQuotes[randomIndex] + ".mp4")
    }
    else
        res.json({ video: "https://cdn.cute.bet/assets/media/" + weightedQuotes[randomIndex] + ".mp4" });


})

module.exports = RandomAPI