const { Events } = require('discord.js');

/**
 * Event handler for handling interactions.
 * @param {Client} client - The Discord client instance.
 */
function handleInteractionCreate(client) {
    client.on(Events.InteractionCreate, async interaction => {
        // Check if the interaction is a chat input command
        if (!interaction.isChatInputCommand()) return;

        // Log the interaction command name for debugging
        console.log(`Interaction command name: ${interaction.commandName}`);

        // Get the command from the client commands collection
        const command = client.commands.get(interaction.commandName);

        // Log available commands for debugging
        //console.log(`Available commands in collection:`, client.commands.keys());

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
}

module.exports = handleInteractionCreate;
