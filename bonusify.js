import fetch from 'node-fetch'
import fs from 'fs'
import YAML from 'yaml'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function readConfig() {
    const configFile = fs.readFileSync('./config.yaml', 'utf8')
    const config = YAML.parse(configFile)

    const token = config.token
    const tokenQuery = `access_token=${token}`
    const recipients = config.team
    const userId = config.userId
    return { tokenQuery, recipients, userId }
}

async function getCurrentBalance(userId, tokenQuery) {
    console.log(userId, tokenQuery)
    const getUserResponse = await fetch(
        `https://bonus.ly/api/v1/users/${userId}?${tokenQuery}`
    )
    const userData = await getUserResponse.json()
    const givingBalance = userData.result.giving_balance
    return givingBalance
}

console.log('starting up...')

console.log('reading config...')
const { tokenQuery, recipients, userId } = readConfig()

console.log('getting user data...')
const givingBalance = await getCurrentBalance(userId, tokenQuery)
console.log(`giving balance: ${givingBalance}`)

console.log(`calculating bonus amount...`)
const amount = Math.floor(givingBalance / recipients.length)
console.log(`amount: ${amount}`)
const remainder = givingBalance - amount * recipients.length
console.log(`remainder: ${remainder}`)

const message = `${recipients
    .map((x) => `@${x}`)
    .join(' ')} +${amount} Thank you all! #dreamteam`
console.log('------------------------------------------------------------')
console.log('MESSAGE:')
console.log(`${message}`)
console.log('------------------------------------------------------------')

rl.question('Are you ready to send the bonus? (y/n)', async (answer) => {
    if (answer === 'y') {
        console.log('sending bonus...')
        const request = {
            reason: message,
        }
        const sendBonusResponse = await fetch(
            `https://bonus.ly/api/v1/bonuses?${tokenQuery}`,
            {
                method: 'post',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' },
            }
        )
        const data = await sendBonusResponse.json()
        //todo: parse response and check for errors
        console.log(
            `bonus sent. ${recipients.length} people received ${amount} each.`
        )
        console.log(data)
    }
    console.log('done.')
    rl.close()
})
