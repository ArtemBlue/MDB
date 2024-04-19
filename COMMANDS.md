# Modular Discord Bot Commands

This document provides an overview of the commands available in the Modular Discord Bot. Users with appropriate permissions can execute these commands in Discord.

## Table of Contents

- [Setup Commands](#setup-command)
- [Ban Commands](#ban-command)


# `/setup` Command

The `/setup` command allows server administrators to configure various aspects of the Discord server using the Modular Discord Bot. This includes setting up welcome channels, custom welcome messages, and log channels.

## Usage

### Table of Contents

- [Setting Welcome Channel](#setting-welcome-channel)
- [Setting Custom Welcome Message](#setting-custom-welcome-message)
- [Setting Log Channel](#setting-log-channel)

### Setting Welcome Channel

- **Command**: `/setup welcomechannel`
- **Description**: Set the welcome channel for the server.
- 
- **Options**:
    - `channel`: The text channel to set as the welcome channel.
    - `remove`: Removes the current welcome channel setting.
- **Usage**:
    - `/setup welcomechannel #welcome` - Set the welcome channel to `#welcome`.
    - `/setup welcomechannel --remove` - Remove the current welcome channel setting.

### Setting Custom Welcome Message

- **Command**: `/setup welcomemessage`
- **Description**: Set a custom welcome message for the server.
- **Options**:
    - `remove`: Remove the current custom welcome message setting.
- **Usage**:
    - `/setup welcomemessage` - Set a new custom welcome message.
    - `/setup welcomemessage --remove` - Remove the current custom welcome message.
- **Notes**:
    - When setting a new custom welcome message, the bot will prompt you for the message. 
    - You can use the `[user]` placeholder to tag the new user.
    - Respond with `[skip]` to cancel setting a new welcome message.
    - Respond with `[default]` to set the message back to the default welcome message.

### Setting Log Channel

- **Command**: `/setup logchannel`
- **Description**: Set the log channel for the server.
- **Options**:
    - `channel`: The text channel to set as the log channel.
    - `remove`: Removes the current log channel setting.
- **Usage**:
    - `/setup logchannel #logs` - Set the log channel to `#logs`.
    - `/setup logchannel --remove` - Remove the current log channel setting.


# `/ban` Command

The `/setup` command allows ban priviledged members to utilize various ban features for Modular Discord Bot. This includes setting up welcome ban user, unban, and list banned users.

## Table of Contents

- [Ban Commands](#ban-commands)
- [Kick Commands](#kick-commands)
- [Other Commands](#other-commands)

## Ban Commands

### `/ban user @username [reason]`

- **Description**: Bans the specified user from the server.
- **Usage**: `/ban user @username [reason]`
- **Example**: `/ban user @baduser spamming`

### `/ban list`

- **Description**: Lists all banned users in the server.
- **Usage**: `/ban list`
- **Pagination**: Displays 5 banned users per page. Use navigation buttons to navigate through pages.
- **Example**: `/ban list`

### `/ban unban userid`

- **Description**: Unbans the specified user by their user ID.
- **Usage**: `/ban unban userid`
- **Example**: `/ban unban 123456789012345678`

## Kick Commands

### `/kick @username [reason]`

- **Description**: Kicks the specified user from the server.
- **Usage**: `/kick @username [reason]`
- **Example**: `/kick @baduser disruptive behavior`

## Other Commands

- Add other commands available in your bot here.

For additional support or troubleshooting, please check the main README.md or visit our [GitHub repository](https://github.com/ArtemBlue/MDB).

If you encounter any issues or have any suggestions for new commands, feel free to open an issue or pull request on GitHub.
