const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // Define the command data using SlashCommandBuilder
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Says hello to the user.'),
    
    // Define the execute function for the command
    execute: async (interaction) => {
        // Respond with a hello message
        await interaction.reply('Hello!');
    },
};
