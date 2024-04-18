// Function to register global and guild commands
async function registerCommands(client, guildId) {
    try {
        // Check if global commands exist
        if (!client.globalCommands) {
            console.error('Global commands collection is undefined.');
            return;
        }
        
        // Register global commands
        const globalCommands = client.globalCommands.map(cmd => cmd.data.toJSON());
        if (globalCommands && globalCommands.length > 0) {
            await client.application.commands.set(globalCommands);
            console.log('Global commands registered!');
        } else {
            console.warn('No global commands found to register.');
        }

        // Register guild commands if guildId is provided
        if (guildId) {
            // Check if guild commands exist
            if (!client.guildCommands) {
                console.error(`Guild commands collection is undefined for guild ID: ${guildId}`);
                return;
            }
            
            const guildCommands = client.guildCommands.map(cmd => cmd.data.toJSON());
            if (guildCommands && guildCommands.length > 0) {
                const guild = await client.guilds.fetch(guildId);
                await guild.commands.set(guildCommands);
                console.log(`Commands registered for guild ID: ${guildId}`);
            } else {
                console.warn(`No guild commands found to register for guild ID: ${guildId}`);
            }
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

module.exports = registerCommands;
