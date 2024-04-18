const { EmbedBuilder } = require('discord.js');
const { readGuildConfigs } = require('../guildconfig/guildConfigManager');

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
                let commandName = interaction.commandName;

                // Extracting options, subcommand, and subcommand group
                let commandOptions = interaction.options.data;

                // Handle subcommand group if present
                if (interaction.options.getSubcommandGroup(false)) {
                    let subcommandGroupName = interaction.options.getSubcommandGroup();
                    let subcommandGroupOptions = commandOptions.find(opt => opt.name === subcommandGroupName);

                    if (subcommandGroupName) {
                        commandName += ` ${subcommandGroupName}`;
                        commandOptions = subcommandGroupOptions.options;
                    }
                }

                // Handle subcommand if present
                if (interaction.options.getSubcommand(false)) {
                    let subcommandName = interaction.options.getSubcommand();
                    let subcommandOptions = commandOptions.find(opt => opt.name === subcommandName);

                    if (subcommandName) {
                        commandName += ` ${subcommandName}`;
                        commandOptions = subcommandOptions.options;
                    }
                }
        
                // Format options
                let options = commandOptions.map(opt => {
                    // Convert channel ID to mention format
                    let value = opt.value;
                    if (opt.type === 'CHANNEL' && value) {
                        const channel = interaction.client.channels.cache.get(value);
                        if (channel) {
                            value = channel.toString(); // Convert channel ID to mention format
                        }
                    }
                    return `${opt.name}: ${value ?? 'Not provided'}`;
                }).join(', ') || 'No options';

                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Command Executed:')
                    .addFields(
                        { name: 'Name', value: commandName },
                        { name: 'Options', value: options },
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
