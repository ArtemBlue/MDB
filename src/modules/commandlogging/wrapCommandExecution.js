const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder } = require('discord.js');
const { readGuildConfigs } = require('../guildConfigManager');

// Define the logCommandExecution function
const logCommandExecution = async (interaction) => {
    try {
        console.log('Logging command execution...');

        // Retrieve guild configurations
        const guildConfigs = readGuildConfigs();

        // Validate guildConfigs and guilds property
        if (!guildConfigs || !guildConfigs.guilds) {
            console.warn('Guild configurations or guilds property is missing. Unable to log command execution.');
            return;
        }

        const guildId = interaction.guildId;
        const logChannelId = guildConfigs.guilds[guildId]?.logChannel;

        if (logChannelId) {
            const logChannel = interaction.client.channels.cache.get(logChannelId);
            if (logChannel) {
                const commandName = interaction.commandName;

                // Get the options and handle undefined values gracefully
                const options = interaction.options.data.map(opt => {
                    let optionValue = opt.value;

                    // Handle undefined option values by using a default message
                    if (optionValue === undefined) {
                        optionValue = 'Not provided';
                    }

                    // Handle CHANNEL type options by fetching the channel name
                    if (opt.type === 'CHANNEL') {
                        const channel = interaction.guild.channels.cache.get(opt.value);
                        if (channel) {
                            optionValue = channel.name;
                        } else {
                            optionValue = `Unknown channel (ID: ${opt.value})`;
                        }
                    }

                    // Tag users and roles
                    if (opt.type === 'USER') {
                        optionValue = `<@${opt.value}>`;
                    } else if (opt.type === 'ROLE') {
                        optionValue = `<@&${opt.value}>`;
                    } else if (opt.type === 'CHANNEL') {
                        optionValue = `<#${opt.value}>`;
                    }

                    return `${opt.name}: ${optionValue}`;
                }).join(', ');

                const embed = new EmbedBuilder()
                    .setTitle('Command Executed:')
                    .addFields(
                        { name: 'Name', value: commandName },
                        { name: 'Options', value: options || 'No options' },
                        { name: 'User', value: `<@${interaction.user.id}>` } // Tag the user who ran the command
                    )
                    .setFooter({ text: `Ran on ${new Date().toLocaleString()}` });

                // Send the embed message to the log channel
                await logChannel.send({ embeds: [embed] });

                console.log('Command execution logged successfully.');
            } else {
                console.warn(`Log channel not found for guild ID: ${guildId}`);
            }
        } else {
            console.log(`No log channel set for guild ID: ${guildId}`);
        }
    } catch (error) {
        console.error('Error logging command execution:', error);
    }
};

// Define the wrapCommandExecution function
const wrapCommandExecution = (command) => {
    // Ensure the command object has an execute function
    if (typeof command.execute !== 'function') {
        throw new Error(`Command does not have an execute function`);
    }

    // Create a wrapped execute function
    const wrappedExecute = async (interaction) => {
        try {
            console.log(`Executing command: ${interaction.commandName}`);

            // Execute the actual command
            await command.execute(interaction);

            console.log(`Command ${interaction.commandName} executed successfully.`);

            // Log the command execution
            await logCommandExecution(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);

            // Handle error gracefully
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
            }
        }
    };

    // Return the command object with the wrapped execute function
    return {
        ...command,
        execute: wrappedExecute,
    };
};

// Export both functions from the file
module.exports = {
    wrapCommandExecution,
    logCommandExecution,
};
