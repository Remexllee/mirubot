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

process.env.DEBUG = 'dialogflow:debug' // enables lib debugging statements

// URLs for images used in card rich responses
const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png'
const imageUrl2 = 'https://lh3.googleusercontent.com/Nu3a6F80WfixUqf_ec_vgXy_c0-0r4VLJRXjVFF_X_CIilEu8B9fT35qyTEj_PEsKw'
const linkUrl = 'https://assistant.google.com/'

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

  function other (agent) {
    fetch('https://www.priceline.com/pws/v0/psapi/search/pricecache')
      .then(res => res.json())
      .then(json => {
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
      })
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
  }
  agent.handleRequest(intentMap)
})

fetch('https://www.priceline.com/pws/v0/psapi/search/pricecache',
  {
    method: 'get',
    headers: {'Content-Type': 'application/json'},
    referer: 'https://www.priceline.com/vacationpackages/',
    cookie: `SITESERVER=ID=7afdee19087743a3891561d566748175; vid=v20181024131539661ffdc9; pclnguidse=166b86ffafbd57e45bf86f68bd699aa12a62d22e; pclnguidpe=166b86ffafbd57e45bf86f68bd699aa12a62d22e; pxvid=e790bb30-d78e-11e8-8500-1df2300fa9fd; _pxvid=e790bb30-d78e-11e8-8500-1df2300fa9fd; ftr_ncd=6; _ga=GA1.2.1092710423.1540386941; G_ENABLED_IDPS=google; G_AUTHUSER_H=0; cto_lwid=36d27fdf-55a0-419d-9f25-ad510bd00991; intent_media_prefs=; im_puid=444129d4-4ebf-43b7-8425-10f8599035df; t-senduserscore=traffic-active; ats-cid-AM-141472-sid=34768954x; __gads=ID=1620e2f4d0e3ffb0:T=1540386981:S=ALNI_MaQD2esyfKDVGwhEgq6lxxurCDpxg; air_ond=SHE-JFK,SHE-NYC; _litra_id.f377=a-00np--5aa61d01-9dee-4d98-9523-411e8204103e.1543707050.2.1543763955.1543707147.fad5a37d-0d90-490d-b64b-500f98074150; RT="r=https%3A%2F%2Fwww.priceline.com%2Fm%2Ffly%2Fsearch%2FSHE-JFK-20190211%2FJFK-SHE-20190809%2F%3Fcabin-class%3DECO%26num-adults%3D1%26search-type%3D1111%26stale-search%3Dtrue&ul=1543764405004&hd=1543764405032"; AMP_TOKEN=%24NOT_FOUND; _gid=GA1.2.661951407.1543982479; _fbp=fb.1.1543982480930.594407803; im_snid=ec88aec8-be89-4c1d-aa9c-a96c0a58baa4; DCS=MXwxNTQzOTg1Njcwfk5Z.dXluZnVmRWtHZ1lrUENDMDRIUUxSWFY2bEZ6V3BtK25aY3hqTWxSb05ZVT0=; _gat_UA-2975581-1=1; _dc_gtm_UA-2975581-1=1; _dc_gtm_UA-2975581-7=1; _pxff_tm=1; _px2=eyJ1IjoiZTk0NDJiMjAtZjg0OS0xMWU4LThkYmYtZTc1M2M4ZDEyNDdmIiwidiI6ImU3OTBiYjMwLWQ3OGUtMTFlOC04NTAwLTFkZjIzMDBmYTlmZCIsInQiOjE1NDM5ODU5OTY1NTEsImgiOiI2YzdiZWUxZDhhN2FlM2FhOTE0ZWRlOGEwZGY4MGI5YTY4Njc4MDA2OGQ0MWMxZTA3OTQ4ODkzMDhlNTY0ZTJmIn0=; forterToken=5baefabdd37a49898e51a5e27e31f3ca_1543985696056__UDF43_6; _pxde=e01460b4bf498ac50443724ef733ba19b8349ce8c8efef63dd479b9475e4f9f4:eyJ0aW1lc3RhbXAiOjE1NDM5ODU3MDAwNjR9; utag_main=v_id:0166a6377134002e5754ffa157e003079002807100838$_sn:9$_ss:0$_st:1543987501266$ses_id:1543985673471%3Bexp-session$_pn:3%3Bexp-session; Referral=CLICKID=&WEBENTRYTIME=12%2F4%2F2018%2023%3A55%3A4&ID=DIRECT&PRODUCTID=&SOURCEID=DT`,
    'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36`
  })
  .then(res => {
    console.log(res)
    return res.json()
  })
  .then(json => {
    console.log(json)
  })