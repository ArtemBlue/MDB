const { Events } = require('discord.js');

/**
 * Event handler for 'InteractionCreate' events.
 * @param {Client} client - The Discord client instance.
 */
function handleInteractionCreate(client) {
    client.on(Events.InteractionCreate, async interaction => {
        // Check if the interaction is a chat input command
        if (!interaction.isChatInputCommand()) return;

        // Find the command in the appropriate collection
        let command = null;
        if (interaction.guildId) {
            command = client.guildCommands.get(interaction.commandName);
        }

        if (!command) {
            command = client.globalCommands.get(interaction.commandName);
        }

        // Handle command execution
        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing command '${interaction.commandName}': ${error}`);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else {
            console.warn(`No command found for interaction '${interaction.commandName}'`);
        }
    });
}

// Export the handler function so it can be imported elsewhere
module.exports = handleInteractionCreate;
