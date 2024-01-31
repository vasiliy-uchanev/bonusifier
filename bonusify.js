import fetch from 'node-fetch'
import fs from 'fs'
import YAML from 'yaml'

// const emailEncoded = encodeURIComponent(email);
// const userResponse = await fetch(`https://bonus.ly/api/v1/users?limit=20&email=${emailEncoded}&include_archived=false&${tokenQuery}`);
// const data = await userResponse.json();
// console.log(data);

// const givenBonusesResponse = await fetch(`https://bonus.ly/api/v1/bonuses?limit=20&giver_email=${emailEncoded}&include_children=false&${tokenQuery}`);
// const lastBonuses = await givenBonusesResponse.json();

console.log('starting up...')

console.log('reading config...')

const configFile = fs.readFileSync('./config.yaml', 'utf8')
const config = YAML.parse(configFile)

const token = config.token
const tokenQuery = `access_token=${token}`

const recipients = config.team
const userId = config.userId

console.log('getting user data...')
const getUserResponse = await fetch(
    `https://bonus.ly/api/v1/users/${userId}?${tokenQuery}`
)
const userData = await getUserResponse.json()
const givingBalance = userData.result.giving_balance
console.log(`giving balance: ${givingBalance}`)

console.log(`calculating bonus amount...`)
const amount = Math.floor(givingBalance / recipients.length)
console.log(`amount: ${amount}`)
const remainder = givingBalance - amount * recipients.length
console.log(`remainder: ${remainder}`)

const message = `${recipients
    .map((x) => `@${x}`)
    .join(' ')} +${amount} Thank you all! #dreamteam`
console.log(`message: ${message}`)

const request = {
    reason: message,
}

console.log('sending bonus...')
const sendBonusResponse = await fetch(
    `https://bonus.ly/api/v1/bonuses?${tokenQuery}`,
    {
        method: 'post',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' },
    }
)
const data = await sendBonusResponse.json()
console.log(data)

console.log('done.')
