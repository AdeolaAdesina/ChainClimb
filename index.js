const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,                  // Required for general guild operations
        GatewayIntentBits.GuildMessages,           // Required to handle message events
        GatewayIntentBits.MessageContent,          // Required to read message content (for commands)
        GatewayIntentBits.GuildMembers,            // Required to handle member events (for assigning roles)
        // Add more intents here based on what your bot needs
    ],
});
// Base API settings
const BASESCAN_API_URL = process.env.BASESCAN_API_URL;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

// Define the role levels and minimum transaction thresholds
const roleLevels = [
    { level: 'L2', minTransactions: 500 },
    { level: 'L3', minTransactions: 1000 },
    { level: 'L4', minTransactions: 5000 },
    { level: 'L5', minTransactions: 10000 },
    { level: 'L6', minTransactions: 20000 }
];

// Function to fetch transaction count from Basescan API
async function getTransactionCount(address) {
    try {
        const response = await axios.get(`${BASESCAN_API_URL}${address}&apikey=${BASESCAN_API_KEY}`);
        const transactions = response.data.result;
        return transactions.length; // Total transaction count
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return 0;
    }
}

// Function to update user roles based on transactions
async function updateUserRole(member, txCount) {
    for (let i = roleLevels.length - 1; i >= 0; i--) {
        const role = member.guild.roles.cache.find(r => r.name === roleLevels[i].level);
        if (txCount >= roleLevels[i].minTransactions) {
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                return member.send(`Congratulations! You've been promoted to ${role.name}.`);
            }
            break;
        }
    }
}

// Event listener for bot readiness
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Event listener for commands
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!txcount')) {
        const args = message.content.split(' ');
        const address = args[1];

        if (!address) {
            return message.reply('Please provide an application address.');
        }

        const txCount = await getTransactionCount(address);
        const member = message.member;

        await updateUserRole(member, txCount);
        message.reply(`The application at address ${address} has ${txCount} onchain transactions.`);
    }
});

// Log in to Discord using the bot token
client.login(process.env.DISCORD_TOKEN);
