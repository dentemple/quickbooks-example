const express = require('express')
const bodyParser = require('body-parser')
const serverless = require('serverless-http')

const OAuthClient = require('intuit-oauth')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const oauthClient = new OAuthClient({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  environment: 'development',
  redirectUri: 'http://localhost:4000/api/redirect',
  logging: true
})

app.get('/start', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: 'testState'
  })

  res.redirect(authUri)
})

app.get('/api/redirect', (req, res) => {
  const { url } = req
  oauthClient.createToken(url).then(AuthResponse => {
    const access_token = AuthResponse.token.access_token
    res.redirect('/auth' + '?access_token=' + access_token)
  })
})

app.get('/auth', (req, res) => {
  const { access_token } = req.query

  const base = 'sandbox-quickbooks.api.intuit.com'
  const id = process.env.COMPANYID
  const ver = '4'

  // const fetchRequest = `https://${base}/v3/company/${id}/invoice?minorversion=${ver}`
  // const options = {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     Authorization: 'Bearer ' + access_token,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     Line: [
  //       {
  //         Amount: 100.0,
  //         DetailType: 'SalesItemLineDetail',
  //         SalesItemLineDetail: {
  //           ItemRef: {
  //             value: '1',
  //             name: 'Services'
  //           }
  //         }
  //       }
  //     ],
  //     CustomerRef: {
  //       value: '1'
  //     }
  //   })
  // }

  const fetchRequest = `https://${base}/v3/company/${id}/invoice/146?minorversion=${ver}`
  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + access_token,
      'Content-Type': 'application/json'
    }
  }

  res.header('Content-Type', 'application/json')

  fetch(fetchRequest, options)
    .then(fetchResponse => fetchResponse.json())
    .then(json => {
      res.send(JSON.stringify(json, null, 2))
    })
    .catch(err => {
      res.send(JSON.stringify(err, null, 2))
    })
})

app.get('/', (req, res) => res.send({ ping: 'ok', route: '/' }))

// app.listen(PORT, () => console.log(`We are rocking on port ${PORT}.`))
module.exports.handler = serverless(app)
