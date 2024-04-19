const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to the config.json file
const configPath = path.join(__dirname, '../../configs/config.json');

// Function to prompt user for inputs using readline interface
const promptUserInput = (question) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

// Function to handle first-time run
const handleFirstTimeRun = async () => {
    // Create configs directory if it does not exist
    const configsDir = path.join(__dirname, '../../configs');
    if (!fs.existsSync(configsDir)) {
        fs.mkdirSync(configsDir);
    }

    // Prompt user for required inputs
    console.log('First-time run detected. Please provide the following information:');
    const token = await promptUserInput('Discord bot token: ');
    const clientId = await promptUserInput('Discord client ID: ');
    const guildId = await promptUserInput('Guild ID: ');

    // Create the config.json file with the user's inputs
    const configData = JSON.stringify({ token, clientId, guildId }, null, 2);
    fs.writeFileSync(configPath, configData);
    console.log('Configuration file created successfully.');
};

// Export the function for use in index.js
module.exports = handleFirstTimeRun;
