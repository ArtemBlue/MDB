const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

        // Path to the guilds.json file
        const guildConfigPath = path.join(__dirname, '../../../persistentdata/guilds.json');
        const guildsData = JSON.parse(fs.readFileSync(guildConfigPath, 'utf-8'));

        // Retrieve the kick-proof roles from the guild data
        const kickProofRoles = guildsData.guilds[interaction.guild.id]?.kickProofRoles || [];

        // Fetch the member to kick from the guild
        const memberToKick = await interaction.guild.members.fetch(userToKick.id);

        // Check if the member has any of the kick-proof roles
        const hasKickProofRole = memberToKick.roles.cache.some(role => kickProofRoles.includes(role.id));

        if (hasKickProofRole) {
            // User has a kick-proof role; kick is not allowed
            await interaction.reply({
                content: `User ${userToKick.tag} has a kick-proof role and cannot be kicked.`,
                ephemeral: true
            });
        } else {
            // Proceed with the kick
            try {
                await memberToKick.kick(reason);
                await interaction.reply({
                    content: `Kicked ${userToKick.tag} for reason: ${reason}`,
                    ephemeral: true
                });
            } catch (error) {
                console.error(`Error kicking user: ${error}`);
                await interaction.reply({
                    content: `Failed to kick user: ${userToKick.tag}`,
                    ephemeral: true
                });
            }
        }
    },
};

module.exports = {
    data: kickCommand.data,
    execute: kickCommand.execute,
};
