const fs = require('fs');
const path = require('path');

// File path to the guild configurations
const guildConfigsPath = path.join(__dirname, '..', '..',  'persistentdata', 'guilds.json');

// Ensure the persistentdata folder and guilds.json file exist
const ensureDataFileExists = () => {
    const persistentDataPath = path.join(__dirname, '..', '..', 'persistentdata');

    // Check if persistentdata folder exists
    if (!fs.existsSync(persistentDataPath)) {
        fs.mkdirSync(persistentDataPath);
    }

    // Check if guilds.json file exists
    if (!fs.existsSync(guildConfigsPath)) {
        // Create an empty guilds.json file
        fs.writeFileSync(guildConfigsPath, JSON.stringify({ guilds: {} }, null, 2), 'utf8');
    }
};

// Call the function to ensure the data file exists
ensureDataFileExists();

// Read guild configurations from the JSON file
const readGuildConfigs = () => {
    try {
        const data = fs.readFileSync(guildConfigsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading guild configurations:', error);
        return { guilds: {} };
    }
};

// Write guild configurations to the JSON file
const writeGuildConfigs = (configs) => {
    try {
        fs.writeFileSync(guildConfigsPath, JSON.stringify(configs, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing guild configurations:', error);
    }
};

module.exports = {
    readGuildConfigs,
    writeGuildConfigs
};
