const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { readGuildConfigs, writeGuildConfigs } = require('../../../modules/guildconfig/guildConfigManager.js');

const setupCommand = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup various aspects of the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        // Subcommand for setting log channel
        .addSubcommand(subcommand => subcommand
            .setName('logchannel')
            .setDescription('Set the log channel for the server.')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('The channel to set as the log channel.')
                .setRequired(false))
            .addBooleanOption(option => option
                .setName('remove')
                .setDescription('Remove the log channel setting.')
                .setRequired(false))
        )
        // Subcommand for setting welcome channel
        .addSubcommand(subcommand => subcommand
            .setName('welcomechannel')
            .setDescription('Set the welcome channel for the server.')
            .addChannelOption(option => option
                .setName('channel')
                .setDescription('The channel to set as the welcome channel.')
                .setRequired(false))
            .addBooleanOption(option => option
                .setName('remove')
                .setDescription('Remove the welcome channel setting.')
                .setRequired(false))
        ),
    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guildId;
            let guildConfigs = readGuildConfigs();

            // Ensure guild configuration is initialized
            if (!guildConfigs.guilds) {
                guildConfigs.guilds = {};
            }

            if (!guildConfigs.guilds[guildId]) {
                guildConfigs.guilds[guildId] = {};
            }

            const handleChannelOption = async (optionName, configKey, successMessage) => {
                const remove = interaction.options.getBoolean('remove');
                const channel = interaction.options.getChannel(optionName);

                // Check if the channel is valid and bot has access to it
                if (channel && !channel.isTextBased()) {
                    await interaction.reply('The provided channel is not a valid text channel.');
                    return;
                }

                if (remove) {
                    // Remove the specified setting
                    delete guildConfigs.guilds[guildId][configKey];
                    writeGuildConfigs(guildConfigs);
                    await interaction.reply(`${configKey} setting removed.`);
                } else if (channel) {
                    // Set the specified setting
                    guildConfigs.guilds[guildId][configKey] = channel.id;
                    writeGuildConfigs(guildConfigs);
                    await interaction.reply(`${successMessage} ${channel.toString()}`); // Display channel name
                } else {
                    await interaction.reply(`Please specify a channel to set as the ${configKey}.`);
                }
            };

            if (subcommand === 'logchannel') {
                await handleChannelOption('channel', 'logChannel', 'Log channel set to');
            } else if (subcommand === 'welcomechannel') {
                await handleChannelOption('channel', 'welcomeChannel', 'Welcome channel set to');
            }
        } catch (error) {
            console.error('Error executing setup command:', error);
            await interaction.reply('An error occurred while executing the command.');
        }
    }
};

module.exports = {
    data: setupCommand.data,
    execute: setupCommand.execute
};
