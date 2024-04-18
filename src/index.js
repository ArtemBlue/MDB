const { Client, GatewayIntentBits, Events } = require('discord.js');
const { loadCommands, commandLoader } = require('./modules/commandloading/commandLoader');
const configPath = require('path').join(__dirname, 'configs/config.json');
const config = require('fs').readFileSync(configPath, 'utf-8');
const { token, guildId } = JSON.parse(config);
const handleInteractionCreate = require('./modules/interactionhandler/interactionHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
});

// Load commands
loadCommands(client);

// Event handler for when the client is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Register commands for global and guild scopes
    await commandLoader(client, guildId);
    console.log('Commands registered successfully.');

    // Set the bot's activity
    client.user.setActivity('Serving the server!');
});

// Set up the interaction handler using the function from interactionHandler.js
handleInteractionCreate(client);

// Log in to Discord using the bot's token
client.login(token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
