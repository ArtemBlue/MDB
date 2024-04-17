// Import necessary modules
const { Collection } = require('discord.js');

/**
 * Function to register global and guild commands with Discord.
 * @param {Client} client - The Discord client instance.
 * @param {string} guildId - The ID of the guild where commands will be registered.
 */
async function registerCommands(client, guildId) {
    // Register global commands
    const globalCommands = client.globalCommands.map(cmd => cmd.data.toJSON());
    await client.application.commands.set(globalCommands);
    console.log('Global commands registered!');

    // Register guild commands
    const guildCommands = client.guildCommands.map(cmd => cmd.data.toJSON());
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(guildCommands);
    console.log(`Commands registered for guild ID: ${guildId}`);
}

// Export the function
module.exports = registerCommands;
