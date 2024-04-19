const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const kickCommand = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(false)
        ),
    async execute(interaction) {
        // Retrieve the user and optional reason from the options
        const userToKick = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Attempt to kick the user
        try {
            // Retrieve the member to kick from the guild
            const memberToKick = interaction.guild.members.cache.get(userToKick.id);
            
            // If the member is found, kick them from the server
            if (memberToKick) {
                await memberToKick.kick(reason);
                await interaction.reply(`Kicked ${userToKick.tag} for reason: ${reason}`);
            } else {
                // If the member was not found in the guild
                await interaction.reply(`User not found in the server: ${userToKick.tag}`);
            }
        } catch (error) {
            // Handle errors and inform the user
            console.error(`Error kicking user: ${error}`);
            await interaction.reply(`Failed to kick user: ${userToKick.tag}`);
        }
    },
};

module.exports = {
    data: kickCommand.data,
    execute: kickCommand.execute,
};
