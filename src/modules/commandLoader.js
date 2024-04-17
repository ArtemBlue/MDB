const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

/**
 * Function to initialize command collections and load commands from directories.
 * @param {Client} client - The Discord client instance.
 */
function loadCommands(client) {
    // Create collections for global and guild commands
    client.globalCommands = new Collection();
    client.guildCommands = new Collection();

    // Load commands using the command loader
    const globalCommandsPath = path.join(__dirname, '..', 'commands', 'global');
    loadCommandsFromDirectory(client.globalCommands, globalCommandsPath);

    const guildCommandsPath = path.join(__dirname, '..', 'commands', 'guild');
    loadCommandsFromDirectory(client.guildCommands, guildCommandsPath);

    // Optionally, add more modules loading here if necessary.
}

/**
 * Function to load commands from a specific directory and add them to a collection.
 * @param {Collection} collection - The collection to add commands to.
 * @param {string} directory - The path of the directory to load commands from.
 */
function loadCommandsFromDirectory(collection, directory) {
    try {
        // Load commands from files in the directory
        const commandFiles = fs.readdirSync(directory).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const commandPath = path.join(directory, file);
            const command = require(commandPath);

            // Ensure the command module has the expected structure
            if (command.data && command.execute) {
                collection.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.warn(`Warning: Missing 'data' or 'execute' in ${commandPath}.`);
            }
        }

        // Recursively load commands from subdirectories
        const subDirs = fs.readdirSync(directory, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        subDirs.forEach(subDir => {
            const subDirPath = path.join(directory, subDir);
            loadCommandsFromDirectory(collection, subDirPath);
        });
    } catch (error) {
        console.error(`Error loading commands from ${directory}:`, error);
    }
}

// Export the loadCommands function so it can be used in index.js
module.exports = loadCommands;
