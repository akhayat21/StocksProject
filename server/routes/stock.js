const Moment = require('moment');
const MomentRange = require('moment-range');
const axios = require("axios");
var express = require('express');
require('dotenv').config()
const moment = MomentRange.extendMoment(Moment);
var router = express.Router();

var API_KEY = process.env.API_KEY;


// Single Date Route
router.get('/:symbol', function(req, res, next) {
  console.log(req.params.symbol)
  axios
  .get("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&outputsize=full&symbol="+req.params.symbol+"&interval=5min&apikey=" + API_KEY)
  .then(response => {
    var data = response.data['Time Series (5min)']
      filterSingleDate(data, req.query['startDate']).then(response =>{
        cleanSingleData(data, response).then(response =>{
          peelAndFormat(response).then(response => {
            res.json(response)
          })
        })
      })
    })
});

// Dual Date Route
router.get('/range/:symbol', function(req, res, next) {
  axios
    .get("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&outputsize=full&symbol="+req.params.symbol+"&interval=5min&apikey=" + API_KEY)
    .then(response => {
      var data = response.data['Time Series (5min)']
      filterDoubleDates(data,req.query['startDate'], req.query['endDate']).then(response => {
        cleanDoubleData(data, response).then(response =>{
          peelAndFormat(response).then(response => {
            res.json(response)
          })
        })
      })
    })
});

var peelAndFormat = function(object){
  return new Promise(function(resolve, reject){
    var array = [];
    Object.keys(object).forEach(item => {
      array.push(object[item])
    })
    resolve(array)
  })
}

var filterSingleDate = function(data, inputDate){
  return new Promise(function(resolve, reject){
    validDates = [];
    Object.keys(data).forEach(item => {
      if (item.slice(0, 10)==inputDate){
        validDates.push(item)
      }
    })
    resolve(validDates)
  })
}

var filterDoubleDates  = function(data, startDate, FinishDate){
  return new Promise(function(resolve, reject){
    const start = moment(startDate, 'YYYY-MM-DD');
    const end   = moment(FinishDate, 'YYYY-MM-DD');
    const range = moment.range(start, end);
    validDates = [];
    Object.keys(data).forEach(item => {
      if (range.contains(moment(item))){
        validDates.push(item)
      }
    })
    resolve(validDates)
  })
}

var cleanSingleData = function(data , validDates){
  return new Promise(function(resolve, reject){
    var cleanedData = {};
    validDates.forEach((item) => {
      // Find the hour & minute value of the timestamp in EST
      var hour = parseInt(item.slice(11, 13))
      var minute = parseInt(item.slice(14, 16))
      // Round down the timestamp to neareast hour and convert to Timestamp string eg. "Thu, 04 Mar 2021 01:00:00 GMT"
      var unixTimestamp = new Date(new Date(item).toUTCString()).getTime()/1000
      roundedTimestamp = new Date((unixTimestamp - (unixTimestamp%3600))*1000).toUTCString()
      shortenedTimestamp = roundedTimestamp.slice(5,22)
      // cleanedData is a 2-D array that will store aggregated data where index is based on hour of day
      if (!cleanedData[hour]) {
        // Initialize 2-D array
        cleanedData[hour] = {
          timestamp: shortenedTimestamp, // Set Timestamp to UTC string
          volume: parseInt(data[item]['5. volume']), // Set intial interval Volume
          high: data[item]['2. high'], // Set intial interval highest price
          low: data[item]['3. low'], // Set intial interval lowest price
          open: data[item]['1. open'],
          openMinute: minute,
          close: data[item]['4. close'],
          closeMinute: minute,
        }
      } else {
        // If index exists, the update values based on item
        // Add to the interval's total volume
        cleanedData[hour].volume += parseInt(data[item]['5. volume']); // Sums the volume
        if (data[item]['2. high'] > cleanedData[hour].high) {cleanedData[hour].high = data[item]['2. high']}; //finds the highest price for the interval
        if (data[item]['3. low'] < cleanedData[hour].low) {cleanedData[hour].low = data[item]['3. low']}; //finds the lowest price for the interval
        if (minute < cleanedData[hour].openMinute) {cleanedData[hour].open = data[item]['1. open']; cleanedData[hour].openMinute = minute;} // adjusts open price/minute to lowest time 
        if (minute > cleanedData[hour].closeMinute) {cleanedData[hour].close = data[item]['4. close']; cleanedData[hour].closeMinute = minute;} // adjusts open price/minute to lowest time 
      }
    })
  resolve(cleanedData)
})
}

var cleanDoubleData = function(data , validDates){
  return new Promise(function(resolve, reject){

    var cleanedData = {};
    validDates.forEach((item) => {
      var shortDate = item.slice(0, 10)
      var hour = parseInt(item.slice(11, 13))
      var minute = parseInt(item.slice(14, 16))
      var unixTimestamp = new Date(item).toLocaleDateString('en-US')
  
      if(!cleanedData[shortDate]){
        cleanedData[shortDate] = {
          timestamp: unixTimestamp,
          volume: parseInt(data[item]['5. volume']),
          high: data[item]['2. high'], // Set intial interval highest price
          low: data[item]['3. low'], // Set intial interval lowest price
          open: data[item]['1. open'],
          openHour: hour,
          openMinute: minute,
          close: data[item]['4. close'],
          closeHour: hour,
          closeMinute: minute,
        }
      } else {
        cleanedData[shortDate].volume += parseInt(data[item]['5. volume']);
        if (data[item]['2. high'] > cleanedData[shortDate].high) {cleanedData[shortDate].high = data[item]['2. high']};
        if (data[item]['3. low'] < cleanedData[shortDate].low) {cleanedData[shortDate].low = data[item]['3. low']};
        if (minute <= cleanedData[shortDate].openMinute && hour <= cleanedData[shortDate].openHour) {
          cleanedData[shortDate].open = data[item]['1. open'];
          cleanedData[shortDate].openMinute = minute;
          cleanedData[shortDate].openHour = hour;
        }
        if (minute >= cleanedData[shortDate].closeMinute && hour >= cleanedData[shortDate].closeHour) {
          cleanedData[shortDate].close = data[item]['4. close'];
          cleanedData[shortDate].closeMinute = minute;
          cleanedData[shortDate].closeHour = hour;
        }
      }
    })
    resolve(cleanedData)
  })
}
// TimeStamp | Total Volume | highest price | lowest price | open | close

module.exports = router;
