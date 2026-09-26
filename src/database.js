import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";

fs.mkdirSync(path.dirname(path.resolve(config.databasePath)), {recursive:true});
const db = new Database(config.databasePath);
db.pragma("journal_mode = WAL");

db.exec(
"CREATE TABLE IF NOT EXISTS guild_settings ("+
"guild_id TEXT PRIMARY KEY, activity_channel_id TEXT, log_channel_id TEXT, welcome_channel_id TEXT, welcome_role_id TEXT,"+
"activity_enabled INTEGER NOT NULL DEFAULT 1, activity_hour INTEGER NOT NULL DEFAULT 13, activity_minute INTEGER NOT NULL DEFAULT 0,"+
"activity_emoji TEXT NOT NULL DEFAULT '☑️', activity_required INTEGER NOT NULL DEFAULT 1, prefix TEXT NOT NULL DEFAULT '!', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);"+
"CREATE TABLE IF NOT EXISTS users (guild_id TEXT NOT NULL,user_id TEXT NOT NULL,xp INTEGER NOT NULL DEFAULT 0,level INTEGER NOT NULL DEFAULT 1,"+
"coins INTEGER NOT NULL DEFAULT 0,streak INTEGER NOT NULL DEFAULT 0,last_daily TEXT,last_activity TEXT,total_activity INTEGER NOT NULL DEFAULT 0,"+
"messages INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id));"+
"CREATE TABLE IF NOT EXISTS activity_checks (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,check_date TEXT NOT NULL,message_id TEXT NOT NULL,created_at INTEGER NOT NULL,UNIQUE(guild_id,user_id,check_date));"+
"CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,moderator_id TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL);"+
"CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,reporter_id TEXT NOT NULL,target_id TEXT,type TEXT NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL);"+
"CREATE TABLE IF NOT EXISTS suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,suggestion TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL);"+
"CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,channel_id TEXT NOT NULL,message TEXT NOT NULL,remind_at INTEGER NOT NULL,completed INTEGER NOT NULL DEFAULT 0);"+
"CREATE TABLE IF NOT EXISTS server_notes (id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,moderator_id TEXT NOT NULL,note TEXT NOT NULL,created_at INTEGER NOT NULL);"
);

export function getSettings(guildId){ return db.prepare("SELECT * FROM guild_settings WHERE guild_id=?").get(guildId); }

export function ensureSettings(guildId){
  let row=getSettings(guildId); if(row) return row;
  const now=Date.now();
  db.prepare("INSERT INTO guild_settings(guild_id,activity_channel_id,log_channel_id,welcome_channel_id,welcome_role_id,activity_enabled,activity_hour,activity_minute,activity_emoji,activity_required,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?,?,?,?,?)")
    .run(guildId,config.activityChannelId||null,config.logChannelId||null,config.welcomeChannelId||null,config.welcomeRoleId||null,config.activityHour,config.activityMinute,config.activityEmoji,config.activityRequired,now,now);
  return getSettings(guildId);
}

export function updateSettings(guildId,patch){
  ensureSettings(guildId);
  const allowed=["activity_channel_id","log_channel_id","welcome_channel_id","welcome_role_id","activity_enabled","activity_hour","activity_minute","activity_emoji","activity_required"];
  const entries=Object.entries(patch).filter(([k])=>allowed.includes(k));
  if(!entries.length) return getSettings(guildId);
  const sql=entries.map(([k])=>k+"=?").join(",");
  const values=entries.map(([,v])=>v); values.push(Date.now(),guildId);
  db.prepare("UPDATE guild_settings SET "+sql+",updated_at=? WHERE guild_id=?").run(...values);
  return getSettings(guildId);
}

export function ensureUser(guildId,userId){ db.prepare("INSERT OR IGNORE INTO users(guild_id,user_id) VALUES(?,?)").run(guildId,userId); }
export function getUser(guildId,userId){ ensureUser(guildId,userId); return db.prepare("SELECT * FROM users WHERE guild_id=? AND user_id=?").get(guildId,userId); }

export function addXp(guildId,userId,amount){
  ensureUser(guildId,userId); const p=getUser(guildId,userId); const xp=p.xp+Math.max(0,amount); const level=Math.floor(Math.sqrt(xp/100))+1;
  db.prepare("UPDATE users SET xp=?,level=? WHERE guild_id=? AND user_id=?").run(xp,level,guildId,userId); return getUser(guildId,userId);
}
export function addCoins(guildId,userId,amount){ ensureUser(guildId,userId); db.prepare("UPDATE users SET coins=coins+? WHERE guild_id=? AND user_id=?").run(amount,guildId,userId); return getUser(guildId,userId); }
export function recordMessage(guildId,userId){ ensureUser(guildId,userId); db.prepare("UPDATE users SET messages=messages+1 WHERE guild_id=? AND user_id=?").run(guildId,userId); }

function previousDay(date){ const d=new Date(date+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0,10); }

export function recordActivity(guildId,userId,date,messageId){
  ensureUser(guildId,userId);
  const result=db.prepare("INSERT OR IGNORE INTO activity_checks(guild_id,user_id,check_date,message_id,created_at) VALUES(?,?,?,?,?)").run(guildId,userId,date,messageId,Date.now());
  if(!result.changes) return false;
  const p=getUser(guildId,userId); const streak=p.last_activity===previousDay(date)?p.streak+1:1; const xp=p.xp+25; const level=Math.floor(Math.sqrt(xp/100))+1;
  db.prepare("UPDATE users SET total_activity=total_activity+1,streak=?,last_activity=?,xp=?,coins=coins+10,level=? WHERE guild_id=? AND user_id=?").run(streak,date,xp,level,guildId,userId);
  return true;
}
export function activityLeaderboard(guildId,limit=10){ return db.prepare("SELECT user_id,total_activity,streak,xp,coins,level FROM users WHERE guild_id=? ORDER BY total_activity DESC,streak DESC,xp DESC LIMIT ?").all(guildId,limit); }
export function xpLeaderboard(guildId,limit=10){ return db.prepare("SELECT user_id,xp,level,coins,total_activity,messages FROM users WHERE guild_id=? ORDER BY xp DESC,level DESC LIMIT ?").all(guildId,limit); }
export function addWarning(guildId,userId,moderatorId,reason){ return db.prepare("INSERT INTO warnings(guild_id,user_id,moderator_id,reason,created_at) VALUES(?,?,?,?,?)").run(guildId,userId,moderatorId,reason,Date.now()).lastInsertRowid; }
export function getWarnings(guildId,userId){ return db.prepare("SELECT * FROM warnings WHERE guild_id=? AND user_id=? ORDER BY created_at DESC").all(guildId,userId); }
export function addReport(guildId,reporterId,targetId,type,details){ return db.prepare("INSERT INTO reports(guild_id,reporter_id,target_id,type,details,created_at) VALUES(?,?,?,?,?,?)").run(guildId,reporterId,targetId||null,type,details,Date.now()).lastInsertRowid; }
export function addSuggestion(guildId,userId,text){ return db.prepare("INSERT INTO suggestions(guild_id,user_id,suggestion,created_at) VALUES(?,?,?,?)").run(guildId,userId,text,Date.now()).lastInsertRowid; }
export function addReminder(guildId,userId,channelId,message,at){ return db.prepare("INSERT INTO reminders(guild_id,user_id,channel_id,message,remind_at) VALUES(?,?,?,?,?)").run(guildId,userId,channelId,message,at).lastInsertRowid; }
export function dueReminders(now=Date.now()){ return db.prepare("SELECT * FROM reminders WHERE completed=0 AND remind_at<=?").all(now); }
export function completeReminder(id){ db.prepare("UPDATE reminders SET completed=1 WHERE id=?").run(id); }
export function addServerNote(guildId,userId,moderatorId,note){ return db.prepare("INSERT INTO server_notes(guild_id,user_id,moderator_id,note,created_at) VALUES(?,?,?,?,?)").run(guildId,userId,moderatorId,note,Date.now()).lastInsertRowid; }
export function getServerNotes(guildId,userId){ return db.prepare("SELECT * FROM server_notes WHERE guild_id=? AND user_id=? ORDER BY created_at DESC").all(guildId,userId); }
export function getOpenReports(guildId){ return db.prepare("SELECT * FROM reports WHERE guild_id=? AND status='open' ORDER BY created_at ASC").all(guildId); }
export function setReportStatus(guildId,id,status){ db.prepare("UPDATE reports SET status=? WHERE guild_id=? AND id=?").run(status,guildId,id); }
