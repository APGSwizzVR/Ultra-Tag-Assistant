import {EmbedBuilder} from "discord.js";

export function embed(title,description=""){ return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865F2).setFooter({text:"Ultra Tag Assistant"}).setTimestamp(); }
export function success(title,description){ return new EmbedBuilder().setTitle("✅ "+title).setDescription(description).setColor(0x57F287).setFooter({text:"Ultra Tag Assistant"}).setTimestamp(); }
export function errorEmbed(description){ return new EmbedBuilder().setTitle("❌ Something went wrong").setDescription(description).setColor(0xED4245).setFooter({text:"Ultra Tag Assistant"}).setTimestamp(); }
export function formatDuration(ms){ let s=Math.floor(ms/1000),d=Math.floor(s/86400);s%=86400;let h=Math.floor(s/3600);s%=3600;let m=Math.floor(s/60);s%=60;return [d?d+"d":"",h?h+"h":"",m?m+"m":"",s?s+"s":""].filter(Boolean).join(" ")||"0s"; }
export function parseDuration(input){ const m=/^(\d+)\s*(s|m|h|d|w)$/i.exec(input.trim()); if(!m)return null; return Number(m[1])*({s:1000,m:60000,h:3600000,d:86400000,w:604800000}[m[2].toLowerCase()]); }
export function todayDublin(){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Dublin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
