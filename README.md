# SPARK Discord Bot

## Feature modes
- Every new server starts in `NORMAL` mode.
- `PREMIUM` mode unlocks all implemented feature modules by default.
- The bot owner can manage a server by sending `%manage` to the bot in DM, selecting a server, choosing a mode, and selecting which features to enable.
- Features explicitly denied in the feature manager remain disabled for that server in either mode.
- Bot owners bypass command-level permission checks. This does not override a feature being disabled for a server.

## Leveling
- Book 3, Page 13 in `/panel` opens the Leveling configuration.
- Default progression is one level per 25 messages.
- Configure the messages-per-level threshold, optional announcement channel ID, and announcement template.
- Supported announcement placeholders: `{user}`, `{username}`, `{level}`, `{server}`.
- Prefix commands: `%rank` and `%level` (optionally mention a user).

## Run
1. Install dependencies with `npm install`.
2. Configure `DISCORD_TOKEN` and the MongoDB connection string expected by `index.js` in the host environment.
3. Start with `node index.js`.

The bot needs the Discord intents and server permissions required by the enabled modules. Anti-nuke and other security-sensitive features should be tested on a private test server before being relied on in production.
