import "dotenv/config";

const need = name => {
  const value = process.env[name];
  if (!value) throw new Error("Missing required environment variable: " + name);
  return value;
};

export const config = {
  token: need("DISCORD_TOKEN"),
  clientId: need("CLIENT_ID"),
  guildId: process.env.GUILD_ID || "",
  activityChannelId: process.env.ACTIVITY_CHANNEL_ID || "",
  logChannelId: process.env.LOG_CHANNEL_ID || "",
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
  welcomeRoleId: process.env.WELCOME_ROLE_ID || "",
  activityHour: Number(process.env.ACTIVITY_HOUR || 13),
  activityMinute: Number(process.env.ACTIVITY_MINUTE || 0),
  activityEmoji: process.env.ACTIVITY_EMOJI || "☑️",
  activityRequired: Math.max(1, Number(process.env.ACTIVITY_REQUIRED || 1)),
  databasePath: process.env.DATABASE_PATH || "./data/ultra-tag.sqlite"
};
