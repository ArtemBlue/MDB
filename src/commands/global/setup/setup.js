// Importing required modules from discord.js
const { SlashCommandBuilder, PermissionsBitField, Events } = require('discord.js');
const { readGuildConfigs, writeGuildConfigs } = require('../../../modules/guildconfig/guildConfigManager');

// Create an instance of the SlashCommandBuilder and configure the subcommands
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
        )
        // Subcommand for setting welcome message
        .addSubcommand(subcommand => subcommand
            .setName('welcomemessage')
            .setDescription('Set a custom welcome message for the server.')
            .addBooleanOption(option => option
                .setName('remove')
                .setDescription('Remove the custom welcome message setting.')
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

            if (subcommand === 'welcomemessage') {
                const remove = interaction.options.getBoolean('remove');

                if (remove) {
                    // Remove the welcome message setting
                    delete guildConfigs.guilds[guildId].welcomeMessage;
                    writeGuildConfigs(guildConfigs);
                    await interaction.reply('Welcome message setting removed.');
                } else {
                    // Prompt the user for the welcome message
                    await interaction.reply({
                        content: `Awaiting <@${interaction.user.id}>'s next message to set as the Welcome Message.\nUse [user] placeholder to tag the new user in the custom Welcome Message.\nReply with [skip] to make no changes to the Welcome Message.\nReply with [default] to set message back to default Welcome Message.`,
                        ephemeral: true
                    });

                    // Create a filter to capture the next message from the user who initiated the command
                    const filter = (response) => response.author.id === interaction.user.id;

                    try {
                        // Await the user's next message in the same text channel
                        const nextMessage = await interaction.channel.awaitMessages({
                            filter,
                            max: 1,
                            time: 60000, // Wait for 60 seconds for the user to respond
                            errors: ['time'],
                        });

                        const userResponse = nextMessage.first().content;

                        if (userResponse.trim().toLowerCase() === '[skip]') {
                            // If the user responds with [skip], cancel the command
                            await interaction.followUp('Welcome message setup cancelled.');
                            return;
                        }

                        if (userResponse.trim().toLowerCase() === '[default]') {
                            // If the user responds with [default], set welcome message back to default
                            delete guildConfigs.guilds[guildId].welcomeMessage;
                            writeGuildConfigs(guildConfigs);
                            await interaction.followUp('Welcome message reset to default.');
                            return;
                        }

                        // Save the welcome message in the guild config
                        guildConfigs.guilds[guildId].welcomeMessage = userResponse;
                        writeGuildConfigs(guildConfigs);

                        // Reply with confirmation
                        await interaction.followUp(`Welcome message set: ${userResponse}`);
                    } catch (err) {
                        // If an error occurs (e.g., user does not respond in time), inform the user
                        await interaction.followUp('No valid response received. Command canceled.');
                    }
                }
            } else {
                // Handle other subcommands for log and welcome channels
                const handleChannelOption = async (optionName, configKey, successMessage) => {
                    const remove = interaction.options.getBoolean('remove');
                    const channel = interaction.options.getChannel(optionName);

                    // Check if the channel is valid and the bot has access to it
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
                        await interaction.reply(`${successMessage} ${channel.toString()}`);
                    } else {
                        await interaction.reply(`Please specify a channel to set as the ${configKey}.`);
                    }
                };

                if (subcommand === 'logchannel') {
                    await handleChannelOption('channel', 'logChannel', 'Log channel set to');
                } else if (subcommand === 'welcomechannel') {
                    await handleChannelOption('channel', 'welcomeChannel', 'Welcome channel set to');
                }
            }
        } catch (error) {
            console.error('Error executing setup command:', error);
            await interaction.reply('An error occurred while executing the command.');
        }
    },
};

module.exports = {
    data: setupCommand.data,
    execute: setupCommand.execute,
};
