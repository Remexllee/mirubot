// var GtfsRealtimeBindings = require('gtfs-realtime-bindings')
// var request = require('request')
//
// const key = '4a861608eafb83dd7355f953ab8c5ca9'
// const url = `http://datamine.mta.info/mta_esi.php?key=${key}&feed_id=1`
// var requestSettings = {
//   method: 'GET',
//   url,
//   encoding: null
// }

// request(requestSettings, function (error, response, body) {
//   if (!error && response.statusCode == 200) {
//     var feed = GtfsRealtimeBindings.FeedMessage.decode(body)
//     feed.entity.forEach(function (entity) {
//       if (entity.trip_update) {
//         console.log(JSON.stringify(entity.trip_update, null, 2))
//       }
//     })
//   }
// })

const cheerio = require('cheerio')
const text = '                    <span class=\'TitleDelay\'>Delays</span>                    <span class=\'DateStyle\'>                    &nbsp;Posted:&nbsp;12/05/2018&nbsp; 7:36PM                    </span><br/><br/>                  <body bgcolor=\'White\' style=\'font-family:sans-serif;font-size:10pt;\'>The 7:09PM train from Babylon due Penn at 8:27PM is operating 11 minutes late through Massapequa due to late-arriving equipment.         </body>                <br/><br/>              '
const $ = cheerio.load(text)
const reason = $.text().trim()
const offset = reason.lastIndexOf('     ') + 5
console.log(reason)
console.log(reason.slice(offset))
