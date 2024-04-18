const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const { wrapCommandExecution } = require('../commandlogging/wrapCommandExecution');

// Function to load commands from a directory
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

// Function to load commands into the client
function loadCommands(client) {
    // Create a collection for commands if it doesn't exist
    client.commands = new Collection();

    // Load commands from the directory
    const commandsPath = path.join(__dirname, '..', '..', 'commands');
    loadCommandsFromDirectory(client.commands, commandsPath);

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
}

// Function to register global and guild commands
async function commandLoader(client, guildId) {
    try {
        // Check if global commands exist
        if (!client.globalCommands) {
            console.error('Global commands collection is undefined.');
            return;
        }

        // Register global commands
        const globalCommands = client.globalCommands.map(cmd => cmd.data.toJSON());
        if (globalCommands && globalCommands.length > 0) {
            await client.application.commands.set(globalCommands);
            console.log('Global commands registered!');
        } else {
            console.warn('No global commands found to register.');
        }

        // Register guild commands if guildId is provided
        if (guildId) {
            // Check if guild commands exist
            if (!client.guildCommands) {
                console.error(`Guild commands collection is undefined for guild ID: ${guildId}`);
                return;
            }

            const guildCommands = client.guildCommands.map(cmd => cmd.data.toJSON());
            if (guildCommands && guildCommands.length > 0) {
                const guild = await client.guilds.fetch(guildId);
                await guild.commands.set(guildCommands);
                console.log(`Commands registered for guild ID: ${guildId}`);
            } else {
                console.warn(`No guild commands found to register for guild ID: ${guildId}`);
            }
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Export the functions for loading, registering, and wrapping commands
module.exports = {
    loadCommands,
    commandLoader,
};
