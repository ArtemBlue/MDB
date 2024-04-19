const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { readGuildConfigs, writeGuildConfigs } = require('../../../modules/guildconfig/guildConfigManager');

const setupCommand = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup various aspects of the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('logchannel')
                .setDescription('Set the log channel for the server.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to set as the log channel.')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('remove')
                        .setDescription('Remove the log channel setting.')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomechannel')
                .setDescription('Set the welcome channel for the server.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to set as the welcome channel.')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('remove')
                        .setDescription('Remove the welcome channel setting.')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomemessage')
                .setDescription('Set a custom welcome message for the server.')
                .addBooleanOption(option =>
                    option.setName('remove')
                        .setDescription('Remove the custom welcome message setting.')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('persistentlogs')
                .setDescription('Set persistent logging of commands for the server.')
                .addBooleanOption(option =>
                    option.setName('logging')
                        .setDescription('Enable or disable logging of commands.')
                        .setRequired(true))
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('banproof')
                .setDescription('Manage ban-proof roles.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a ban-proof role.')
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('The role to add as ban-proof.')
                                .setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove a ban-proof role.')
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('The role to remove as ban-proof.')
                                .setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List all ban-proof roles.')
                )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('kickproof')
                .setDescription('Manage kick-proof roles.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a kick-proof role.')
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('The role to add as kick-proof.')
                                .setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove a kick-proof role.')
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('The role to remove as kick-proof.')
                                .setRequired(true))
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('List all kick-proof roles.')
                )
        ),
    async execute(interaction) {
        try {
            const subcommandGroup = interaction.options.getSubcommandGroup(false);
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

            // Handle persistent logging subcommand
            if (subcommand === 'persistentlogs') {
                const logging = interaction.options.getBoolean('logging');
                guildConfigs.guilds[guildId].persistentLogs = logging;
                writeGuildConfigs(guildConfigs);
                await interaction.reply({
                    content: `Persistent logging of commands has been ${logging ? 'enabled' : 'disabled'} for this server.`,
                    ephemeral: true,
                });
            } else if (subcommand === 'logchannel' || subcommand === 'welcomechannel') {
                // Handle other subcommands for log and welcome channels
                const handleChannelOption = async (optionName, configKey, successMessage) => {
                    const remove = interaction.options.getBoolean('remove');
                    const channel = interaction.options.getChannel(optionName);

                    if (channel && !channel.isTextBased()) {
                        await interaction.reply({ content: 'The provided channel is not a valid text channel.', ephemeral: true });
                        return;
                    }

                    if (remove) {
                        delete guildConfigs.guilds[guildId][configKey];
                        writeGuildConfigs(guildConfigs);
                        await interaction.reply({ content: `${configKey} setting removed.`, ephemeral: true });
                    } else if (channel) {
                        guildConfigs.guilds[guildId][configKey] = channel.id;
                        writeGuildConfigs(guildConfigs);
                        await interaction.reply({ content: `${successMessage} ${channel}`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `Please specify a channel to set as the ${configKey}.`, ephemeral: true });
                    }
                };

                if (subcommand === 'logchannel') {
                    await handleChannelOption('channel', 'logChannel', 'Log channel set to');
                } else if (subcommand === 'welcomechannel') {
                    await handleChannelOption('channel', 'welcomeChannel', 'Welcome channel set to');
                }
            } else if (subcommand === 'welcomemessage') {
                const remove = interaction.options.getBoolean('remove');

                if (remove) {
                    delete guildConfigs.guilds[guildId].welcomeMessage;
                    writeGuildConfigs(guildConfigs);
                    await interaction.reply({ content: 'Welcome message setting removed.', ephemeral: true });
                } else {
                    await interaction.reply({
                        content: `Awaiting <@${interaction.user.id}>'s next message to set as the Welcome Message.\nUse [user] placeholder to tag the new user in the custom Welcome Message.\nReply with [skip] to make no changes to the Welcome Message.\nReply with [default] to set the message back to default Welcome Message.`,
                        ephemeral: true
                    });

                    const filter = response => response.author.id === interaction.user.id;

                    try {
                        const nextMessage = await interaction.channel.awaitMessages({
                            filter,
                            max: 1,
                            time: 60000, // Wait for 60 seconds for the user to respond
                            errors: ['time'],
                        });

                        const userResponse = nextMessage.first().content.trim();

                        if (userResponse.toLowerCase() === '[skip]') {
                            await interaction.followUp({ content: 'Welcome message setup cancelled.', ephemeral: true });
                            return;
                        }

                        if (userResponse.toLowerCase() === '[default]') {
                            delete guildConfigs.guilds[guildId].welcomeMessage;
                            writeGuildConfigs(guildConfigs);
                            await interaction.followUp({ content: 'Welcome message reset to default.', ephemeral: true });
                            return;
                        }

                        guildConfigs.guilds[guildId].welcomeMessage = userResponse;
                        writeGuildConfigs(guildConfigs);

                        await interaction.followUp({ content: `Welcome message set: "${userResponse}"`, ephemeral: true });
                    } catch {
                        await interaction.followUp({ content: 'No valid response received. Command canceled.', ephemeral: true });
                    }
                }
            } else if (subcommandGroup === 'banproof' || subcommandGroup === 'kickproof') {
                const configKey = subcommandGroup === 'banproof' ? 'banProofRoles' : 'kickProofRoles';
                const role = interaction.options.getRole('role');

                if (!guildConfigs.guilds[guildId][configKey]) {
                    guildConfigs.guilds[guildId][configKey] = [];
                }

                if (subcommand === 'add') {
                    guildConfigs.guilds[guildId][configKey].push(role.id);
                    writeGuildConfigs(guildConfigs);
                    await interaction.reply({ content: `${role} has been added as a ${subcommandGroup} role.`, ephemeral: true });
                } else if (subcommand === 'remove') {
                    const index = guildConfigs.guilds[guildId][configKey].indexOf(role.id);
                    if (index > -1) {
                        guildConfigs.guilds[guildId][configKey].splice(index, 1);
                        writeGuildConfigs(guildConfigs);
                        await interaction.reply({ content: `${role} has been removed as a ${subcommandGroup} role.`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `${role} is not currently a ${subcommandGroup} role.`, ephemeral: true });
                    }
                } else if (subcommand === 'list') {
                    const roles = guildConfigs.guilds[guildId][configKey];
                    if (roles.length > 0) {
                        const roleMentions = roles.map(roleId => interaction.guild.roles.cache.get(roleId)).join(', ');
                        await interaction.reply({ content: `The following roles are ${subcommandGroup} roles: ${roleMentions}`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: `No ${subcommandGroup} roles are currently set.`, ephemeral: true });
                    }
                }
            }
        } catch (error) {
            console.error('Error executing setup command:', error);
            await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        }
    },
};

module.exports = {
    data: setupCommand.data,
    execute: setupCommand.execute,
};
