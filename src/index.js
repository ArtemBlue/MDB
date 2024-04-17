const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const config = require('./configs/config.json');
const loadCommands = require('./modules/commandLoader');
const handleInteractionCreate = require('./modules/interactionHandler');
const registerCommands = require('./modules/commandRegistration');

// Create the client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Load commands and modules using the command loader
loadCommands(client);

// Set up the interaction create event handler
handleInteractionCreate(client);

// Event handler for the 'ready' event
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Call the function to register global and guild commands
    await registerCommands(client, config.guildId);
});

// Log in to Discord using the bot's token
client.login(config.token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
