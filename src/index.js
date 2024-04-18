const { Client, GatewayIntentBits, Events } = require('discord.js');
const { loadCommands, commandLoader } = require('./modules/commandloading/commandLoader');
const configPath = require('path').join(__dirname, 'configs/config.json');
const config = require('fs').readFileSync(configPath, 'utf-8');
const { token, guildId } = JSON.parse(config);

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

// Event handler for handling interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} found.`);
        return;
    }

    // Execute the command and handle errors
    try {
        // Since the command is already wrapped during loading, directly execute it
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command: ${interaction.commandName}\nError: ${error}`);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error while executing the command!', ephemeral: true });
        }
    }
});

// Log in to Discord using the bot's token
client.login(token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
