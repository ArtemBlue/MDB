# MDB
Modular Discord Bot because bored. Purpose? None. Is it better? Probably not.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Running the Bot](#running-the-bot)
- [Troubleshooting](#troubleshooting)
- [Commands](https://github.com/ArtemBlue/MDB/blob/main/COMMANDS.md)

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) version 14 or later. Follow the [Node.js installation guide](https://nodejs.org/en/download/) for your operating system.
- A Discord account and a bot token. If you don't have a bot token, [follow this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to create a bot application and obtain a token.

## Installation

You have two options for installing the Modular Discord Bot:

### Option 1: Install from GitHub Repository

1. **Clone the repository**:
    - Open a terminal or command prompt and navigate to the directory where you want to store the project.
    - Run the following command to clone the repository:

    ```sh
    git clone https://github.com/ArtemBlue/MDB.git
    ```

2. **Navigate to the project directory**:
    ```sh
    cd mdb
    ```

3. **Install dependencies**:
    - Run the following command to install the required dependencies:

    ```sh
    npm install
    ```

### Option 2: Install from Releases

1. **Download the latest release**:
    - Go to the [Releases page](https://github.com/ArtemBlue/MDB/releases) of the GitHub repository.
    - Download the latest release archive (e.g., a ZIP file) for your operating system.

2. **Extract the archive**:
    - Extract the contents of the archive to a directory of your choice.

3. **Navigate to the extracted directory**:
    - Open a terminal or command prompt and navigate to the directory where you extracted the archive.

4. **Install dependencies**:
    - Run the following command to install the required dependencies:

    ```sh
    npm install
    ```

## Setup

Before running the bot, you need to configure it:

1. **First-Time Setup**:
    - Run the bot with the following command:

    ```sh
    node src/index.js
    ```

    - If this is your first time running the bot, it will guide you through setting up the `config.json` file.
    - Provide the required inputs (bot token, client ID, guild ID, and activity message).

2. **Configure the bot**:
    - The bot's configuration is stored in the `configs/config.json` file.
    - You can manually edit this file if needed.

## Running the Bot

To run the bot:

1. Open a terminal or command prompt in the project's root directory.
2. Run the following command:

    ```sh
    node src/index.js
    ```

The bot should start and connect to your Discord server.

## Troubleshooting

If you encounter any issues, try the following:

- **Check the logs**: The bot will log any errors to the console. Look for error messages to diagnose issues.
- **Verify your configuration**: Double-check that your `configs/config.json` file contains the correct information.
- **Check your internet connection**: Ensure your internet connection is stable.
- **Restart the bot**: Sometimes, restarting the bot can resolve issues.

If you continue to experience problems, you can seek help from the Discord.js community or other relevant forums.

Check out [Commands](https://github.com/ArtemBlue/MDB/blob/main/COMMANDS.md).
