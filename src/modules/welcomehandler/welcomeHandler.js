const fs = require('fs');
const path = require('path');

// Function to read the guild configuration from guilds.json
const readGuildConfig = () => {
    const guildConfigPath = path.resolve(__dirname, '../../persistentdata/guilds.json');
    const data = fs.readFileSync(guildConfigPath, 'utf-8');
    return JSON.parse(data);
};

// Function to write the updated guild configuration back to guilds.json
const writeGuildConfig = (guildConfig) => {
    const guildConfigPath = path.resolve(__dirname, '../../persistentdata/guilds.json');
    fs.writeFileSync(guildConfigPath, JSON.stringify(guildConfig, null, 2), 'utf-8');
};

// Function to handle welcoming new members
const handleWelcome = (client) => {
    // Event listener for when a new member joins a guild
    client.on('guildMemberAdd', async (member) => {
        try {
            // Read the guild configuration
            const guildConfig = readGuildConfig();
            const guildId = member.guild.id;

            // Check if the guild is present in the configuration
            if (guildConfig.guilds && guildConfig.guilds[guildId]) {
                const welcomeChannelId = guildConfig.guilds[guildId].welcomeChannel;

                // Check if welcome channel ID is specified
                if (welcomeChannelId) {
                    // Get the welcome channel from the guild
                    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

                    // Send a welcome message to the welcome channel
                    if (welcomeChannel) {
                        // Get the welcome message from the config or use a default message
                        let welcomeMessage = guildConfig.guilds[guildId].welcomeMessage || `Welcome to the server, ${member.user}! We're glad to have you here.`;

                        // Replace "[user]" with the actual mention of the new user
                        welcomeMessage = welcomeMessage.replace('[user]', `<@${member.user.id}>`);

                        // Send the welcome message
                        await welcomeChannel.send(welcomeMessage);
                        console.log(`Sent welcome message to ${member.user.tag} in channel ${welcomeChannel.name}`);
                    } else {
                        console.warn(`Welcome channel not found for guild ID: ${guildId}`);
                    }
                } else {
                    console.log(`No welcome channel set for guild ID: ${guildId}`);
                }
            } else {
                console.log(`Guild ID ${guildId} not found in the configuration`);
            }
        } catch (error) {
            console.error(`Error welcoming new member: ${error}`);
        }
    });
};

module.exports = handleWelcome;
