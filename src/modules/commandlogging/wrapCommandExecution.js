const { EmbedBuilder } = require('discord.js');
const { readGuildConfigs } = require('../guildconfig/guildConfigManager');
const fs = require('fs');
const path = require('path');

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

        // Retrieve guild ID and log file path
        const guildId = interaction.guildId;
        const logFilePath = path.join(__dirname, '../../persistentdata', `${guildId}_cmdlogs.log`);

        // Ensure the persistentdata directory exists
        const persistentDataDir = path.join(__dirname, '../../persistentdata');
        if (!fs.existsSync(persistentDataDir)) {
            fs.mkdirSync(persistentDataDir, { recursive: true });
        }

        // Ensure the log file exists; create it if it doesn't
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, ''); // Create an empty file if it doesn't exist
        }

        // Log command to file
        const timestamp = new Date().toISOString();

        // Prepare log entry
        const commandName = interaction.commandName;
        const userName = interaction.user.tag;
        const userId = interaction.user.id;

        // Format the options into a string
        const formattedOptions = interaction.options.data.map(opt => `${opt.name}: ${opt.value}`).join(', ') || 'No options';

        // Create log entry string
        const logEntry = `${timestamp} | User: ${userName} (${userId}) | Command: /${commandName} ${formattedOptions}`;

        // Append log entry to the log file
        fs.appendFileSync(logFilePath, logEntry + '\n', 'utf-8');

        console.log('Command execution logged successfully.');

        // Log to Discord channel if configured
        const logChannelId = guildConfigs.guilds[guildId]?.logChannel;
        if (logChannelId) {
            const logChannel = interaction.client.channels.cache.get(logChannelId);
            if (logChannel) {
                // Create the embed
                const embed = new EmbedBuilder()
                    .setTitle('Command Executed:')
                    .addFields(
                        { name: 'Name', value: commandName },
                        { name: 'Options', value: formattedOptions },
                        { name: 'User', value: `<@${userId}>` }
                    )
                    .setFooter({ text: `Ran on ${new Date().toLocaleString()}` });

                // Send the embed message to the log channel
                await logChannel.send({ embeds: [embed] });

                console.log('Command execution logged to Discord channel successfully.');
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
