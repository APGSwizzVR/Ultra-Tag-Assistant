# Ultra Tag Assistant

Official Discord bot for Ultra Tag.

## Daily activity

By default, the bot posts a clean daily activity-check embed at **13:00 Europe/Dublin** every day. It automatically adds the configured check reaction. A member who reacts is recorded once per Dublin calendar day and receives **25 XP + 10 coins**.

The scheduler uses the Europe/Dublin timezone, so Irish daylight-saving changes are handled automatically.

Setup:
1. Create a Discord application and bot.
2. Enable the required privileged intents.
3. Copy .env.example to .env.
4. Set DISCORD_TOKEN and CLIENT_ID.
5. Set GUILD_ID while developing if you want instant command registration.
6. Run npm install, npm run deploy, npm start.

## Features

1. Daily activity checks
2. Automatic check reaction
3. Activity streaks
4. Activity leaderboard
5. XP
6. Levels
7. Coins
8. Daily reward
9. Profiles
10. XP leaderboard
11. Message counters
12. Suggestions
13. Player reports
14. Bug reports
15. Report queue
16. Report closing
17. Staff notes
18. Warning system
19. Warning history
20. Member timeout
21. Member kick
22. Member ban
23. Bulk message clearing
24. Channel slowmode
25. Channel lock
26. Channel unlock
27. Branded announcements
28. Reaction polls
29. Reaction giveaways
30. Activity-channel configuration
31. Log-channel configuration
32. Activity-time configuration
33. Activity-emoji configuration
34. Activity enable/disable
35. Reminder system
36. 8-ball
37. Coin flip
38. Dice roller
39. User information
40. Avatar viewer
41. Server information
42. Bot status
43. Ping/latency
44. Welcome messages
45. Automatic welcome role
46. Verification role command
47. Uptime
48. SQLite persistence

## Commands

Community: /help /profile /activity /leaderboard /rank /daily /streak /suggest /report /remind

Utilities: /ping /botinfo /server /userinfo /avatar /8ball /coinflip /roll /status /verify

Setup: /set-activity-channel /set-log-channel /activity-config /activity-test

Moderation: /warn /warnings /timeout /kick /ban /clear /slowmode /lock /unlock

Staff: /note /notes /reports /report-close /announce /poll /giveaway

## Activity setup

Use /set-activity-channel and optionally /activity-config.

Example configuration:
 /activity-config enabled:true hour:13 minute:0 emoji:☑️ required:1

Preview with /activity-test.

The bot uses SQLite in ./data and that folder is ignored by Git. For hosting on an ephemeral filesystem, use a persistent volume or replace the database layer with a hosted database.

Discord permissions and privileged-intent requirements can change. Check the current Discord Developer documentation before production deployment.
