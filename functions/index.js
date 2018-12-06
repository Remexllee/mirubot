/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const functions = require('firebase-functions')
const {WebhookClient} = require('dialogflow-fulfillment')
const {Card, Suggestion} = require('dialogflow-fulfillment')
const {Carousel} = require('actions-on-google')
const fetch = require('node-fetch')
const get = require('lodash/get')

let statusObject = {}
let count = 0
let LIRRMap = new Map()

const buildLIRRMap = (statusObject) => {
  const lines = get(JSON.parse(statusObject), 'LIRR.line', [])
  for (let line of lines) {
    LIRRMap.set(line.name.toLowerCase(), line)
  }
}

const updateStatus = () => {
  fetch('http://www.mta.info/service_status_json/25734120')
    .then(res => res.text())
    .then(body => {
      statusObject = JSON.parse(body)
      console.log(statusObject)
      buildLIRRMap(statusObject)
      console.log('status update')
      count++
    })
}

const updateStatusPromise = () =>
  fetch('http://www.mta.info/service_status_json/25734120')
    .then(res => res.text())

// updateStatus()
// let tid = setInterval(updateStatus, 60000)

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({request, response})
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers))
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body))

  function googleAssistantOther (agent) {
    let conv = agent.conv() // Get Actions on Google library conversation object
    conv.ask('Please choose an item:') // Use Actions on Google library to add responses
    conv.ask(new Carousel({
      title: 'Google Assistant',
      items: {
        'WorksWithGoogleAssistantItemKey': {
          title: 'Works With the Google Assistant',
          description: 'If you see this logo, you know it will work with the Google Assistant.',
          image: {
            url: imageUrl,
            accessibilityText: 'Works With the Google Assistant logo',
          },
        },
        'GoogleHomeItemKey': {
          title: 'Google Home',
          description: 'Google Home is a powerful speaker and voice Assistant.',
          image: {
            url: imageUrl2,
            accessibilityText: 'Google Home'
          },
        },
      },
    }))
    // Add Actions on Google library responses to your agent's response
    agent.add(conv)
  }

  function welcome (agent) {
    agent.add(`Welcome to my agent!`)
  }

  function fallback (agent) {
    agent.add(`I didn't understand`)
    agent.add(`I'm sorry, can you try again?`)
  }

  function getLIRRStatus (agent) {
    agent.add(`Got it, let me looking for what is the status for that line!`)
    return updateStatusPromise().then(body => {
      statusObject = JSON.parse(body)
      console.log(statusObject)
      buildLIRRMap(statusObject)
      console.log('status update')
      count++
      let line = get(agent, 'parameters.lirr_line')
      let lineStatus = LIRRMap.get(line.toLowerCase())
      console.log(lineStatus)
      if (lineStatus) {
        if (lineStatus.status === 'DELAYS') {
          const cheerio = require('cheerio')
          const $ = cheerio.load(lineStatus.text)
          const reason = $.text().trim()
          const offset = reason.lastIndexOf('     ') + 5
          agent.add(`the ${line} status is ${lineStatus.status.toLowerCase()}, due to the following reason: ${reason.slice(offset)}`)
        } else {
          agent.add(`the ${line} status is ${lineStatus.status.toLowerCase()}`)
        }
      } else {
        agent.add(`I can't find out the line you are looking`)
      }
    })
  }

  function other (agent) {
    agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`)
    agent.add(new Card({
        title: `Title: this is a card title`,
        imageUrl: imageUrl,
        text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
        buttonText: 'This is a button',
        buttonUrl: linkUrl
      })
    )
    agent.add(new Suggestion(`I am donna`))
    agent.add(new Suggestion(`I am Yang`))
    agent.setContext({name: 'weather', lifespan: 2, parameters: {city: 'Rome'}})
  }

  // Run the proper handler based on the matched Dialogflow intent
  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  intentMap.set('Default Fallback Intent', fallback)
  // if requests for intents other than the default welcome and default fallback
  // is from the Google Assistant use the `googleAssistantOther` function
  // otherwise use the `other` function
  if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
    intentMap.set('hello_world', googleAssistantOther)
  } else {
    intentMap.set('hello_world', other)
    intentMap.set('lirr_status', getLIRRStatus)
  }
  agent.handleRequest(intentMap)
})
