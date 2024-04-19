const { Client, GatewayIntentBits, Events } = require('discord.js');
const { loadCommands, commandLoader } = require('./modules/commandloading/commandLoader');
const fs = require('fs');
const path = require('path');
const handleInteractionCreate = require('./modules/interactionhandler/interactionHandler');
const handleWelcome = require('./modules/welcomehandler/welcomeHandler'); // Import welcomeHandler
const handleFirstTimeRun = require('./modules/firsttimerun/setup'); // Import first-time run setup

// Path to the config.json file
const configPath = path.join(__dirname, 'configs/config.json');

// Function to initialize the bot
const initializeBot = async (config) => {
    const { token, guildId } = config;

    // Create a new Discord client instance
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

        // Initialize welcomeHandler
        handleWelcome(client);
    });

    // Set up the interaction handler using the function from interactionHandler.js
    handleInteractionCreate(client);

    // Log in to Discord using the bot's token
    client.login(token).catch(error => {
        console.error('Failed to login:', error);
        process.exit(1);
    });
};

// Check if config.json exists
if (fs.existsSync(configPath)) {
    // Load the config file if it exists
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    initializeBot(config);
} else {
    // Run first-time run setup if config.json does not exist
    handleFirstTimeRun().then(() => {
        // Once the first-time setup completes, load the config and initialize the bot
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        initializeBot(config);
    }).catch(error => {
        console.error('Error during first-time run setup:', error);
        process.exit(1);
    });
}
