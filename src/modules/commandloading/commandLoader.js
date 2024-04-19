const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { wrapCommandExecution } = require('../commandlogging/wrapCommandExecution');

// Function to load commands from a directory
function loadCommandsFromDirectory(collection, directory, commandType) {
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

                // Log the command being added for debugging
                console.log(`Adding command: ${wrappedCommand.data.name} from ${commandPath}`);

                collection.set(wrappedCommand.data.name, wrappedCommand);
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
            loadCommandsFromDirectory(collection, subDirPath, commandType);
        }
    } catch (error) {
        console.error(`Error loading commands from ${directory}:`, error);
    }
}

// Function to load commands into the client
function loadCommands(client) {
    // Create a new collection for commands
    client.commands = new Collection();

    // Load commands from the specified directory
    const commandsPath = path.join(__dirname, '..', '..', 'commands');
    
    // Load global and guild commands from separate directories
    const globalCommandsPath = path.join(commandsPath, 'global');
    const guildCommandsPath = path.join(commandsPath, 'guild');

    // Load global commands into the global commands collection
    client.globalCommands = new Collection();
    loadCommandsFromDirectory(client.globalCommands, globalCommandsPath);

    // Load guild commands into the guild commands collection
    client.guildCommands = new Collection();
    loadCommandsFromDirectory(client.guildCommands, guildCommandsPath);

    // Combine the collections into a single commands collection
    client.commands = new Collection([...client.globalCommands, ...client.guildCommands]);

    console.log('Commands loaded and separated successfully.');
}

// Function to register global and guild commands
async function commandLoader(client, guildId) {
    try {
        // Register global commands
        if (client.globalCommands && client.globalCommands.size > 0) {
            const globalCommands = client.globalCommands.map(cmd => cmd.data.toJSON());
            await client.application.commands.set(globalCommands);
            console.log('Global commands registered!');
        }

        // Register guild commands
        if (guildId && client.guildCommands && client.guildCommands.size > 0) {
            const guild = await client.guilds.fetch(guildId);
            const guildCommands = client.guildCommands.map(cmd => cmd.data.toJSON());
            await guild.commands.set(guildCommands);
            console.log(`Guild commands registered for guild ID: ${guildId}`);
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
