const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const { wrapCommandExecution } = require('./modules/commandlogging/wrapCommandExecution');
const registerCommands = require('./modules/commandRegistration');

// Read the config file
const configPath = path.join(__dirname, 'configs/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
});

// Load configuration variables
const { token, guildId } = config;

// Create a Collection for commands
client.commands = new Collection();

// Define the loadCommands function
function loadCommands(client) {
    // Create a collection for commands if it doesn't exist
    client.commands = new Collection();

    // Load commands from the directory
    const commandsPath = path.join(__dirname, 'commands');
    loadCommandsFromDirectory(client.commands, commandsPath);
}

// Define the loadCommandsFromDirectory function
function loadCommandsFromDirectory(collection, directory) {
    try {
        // Read command files in the directory
        const commandFiles = fs.readdirSync(directory).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const commandPath = path.join(directory, file);
            const command = require(commandPath);

            // Ensure command has data and execute properties
            if (command && command.data && command.execute) {
                // Wrap the entire command object using wrapCommandExecution
                const wrappedCommand = wrapCommandExecution(command);
                collection.set(wrappedCommand.data.name, wrappedCommand);
                console.log(`Loaded and wrapped command: ${wrappedCommand.data.name}`);
            } else {
                console.warn(`Skipping file ${file}: missing 'data' or 'execute' property.`);
            }
        }

        // Load commands recursively from subdirectories
        const subDirs = fs.readdirSync(directory, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        for (const subDir of subDirs) {
            const subDirPath = path.join(directory, subDir);
            loadCommandsFromDirectory(collection, subDirPath);
        }
    } catch (error) {
        console.error(`Error loading commands from ${directory}:`, error);
    }
}

// Load commands
loadCommands(client);

// Initialize global and guild commands collections
client.globalCommands = new Collection();
client.guildCommands = new Collection();

// Separate the global and guild commands
client.commands.forEach((command, name) => {
    if (command.guildOnly) {
        client.guildCommands.set(name, command);
    } else {
        client.globalCommands.set(name, command);
    }
});

// Event handler for when the client is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Register commands for global and guild scopes
    await registerCommands(client, guildId);
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
