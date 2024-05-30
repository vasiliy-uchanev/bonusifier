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
    const tokenHeader = `Bearer ${token}`
    const recipients = config.team
    const userId = config.userId
    return { tokenHeader, recipients, userId }
}

async function getCurrentBalance(userId, tokenHeader) {
    console.log(userId, tokenHeader)
    const getUserResponse = await fetch(
        `https://bonus.ly/api/v1/users/${userId}`,
        {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                Authorization: tokenHeader,
            },
        }
    )
    const userData = await getUserResponse.json()
    console.log(userData)
    const givingBalance = userData.result.giving_balance
    return givingBalance
}

console.log('starting up...')

console.log('reading config...')
const { tokenHeader, recipients, userId } = readConfig()

console.log('getting user data...')
const givingBalance = await getCurrentBalance(userId, tokenHeader)
console.log(`giving balance: ${givingBalance}`)

console.log(`calculating bonus amount...`)
const amount = Math.floor(givingBalance / recipients.length)
console.log(`amount: ${amount}`)
const remainder = givingBalance - amount * recipients.length
console.log(`remainder: ${remainder}`)

const message = `${recipients
    .map((x) => `@${x}`)
    .join(' ')} +${amount} 🚀 #dreamteam`
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
            `https://bonus.ly/api/v1/bonuses`,
            {
                method: 'post',
                body: JSON.stringify(request),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: tokenHeader,
                },
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
