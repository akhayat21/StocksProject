
const axios = require("axios");
require('dotenv').config()
var express = require('express');
var router = express.Router();

var API_KEY = process.env.API_KEY;

// Autocomplete
router.get('/:keyword', function(req, res, next) {

    axios
      .get("https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords="+ req.params.keyword +"&apikey=" + API_KEY)
      .then(response => {
        var data = response.data['bestMatches'];
        filterCountry(data).then(response => {
          format(response).then(response => {
            res.json(response)
          })
        })
      })
  });

  var filterCountry = function(data){
    return new Promise(function(resolve, reject){
      if(!data){
        resolve([])
      }
      var cleanData = data.filter(item => {
        return item["4. region"] == 'United States'
      })
      resolve(cleanData)
    })
  }

  var format = function(data){
    return new Promise(function(resolve, reject){
      var cleanData = [];
      data.forEach((item, i)=> {
        cleanData[i] = item["1. symbol"]
      })
      resolve(cleanData)
    })
  }

module.exports = router;