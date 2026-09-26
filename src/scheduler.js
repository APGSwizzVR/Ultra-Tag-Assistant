import cron from "node-cron";
import {EmbedBuilder} from "discord.js";
import {ensureSettings,dueReminders,completeReminder} from "./database.js";
import {todayDublin} from "./utils.js";

export function startSchedulers(client){
  globalThis.__utaActivityRuns=new Set();
  cron.schedule("* * * * *",async()=>{
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Dublin",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
    const hour=Number(parts.find(p=>p.type==="hour").value), minute=Number(parts.find(p=>p.type==="minute").value);
    for(const guild of client.guilds.cache.values()){
      try{
        const s=ensureSettings(guild.id), key="activity:"+guild.id+":"+todayDublin();
        if(!s.activity_enabled||!s.activity_channel_id||hour!==s.activity_hour||minute!==s.activity_minute||globalThis.__utaActivityRuns.has(key)) continue;
        globalThis.__utaActivityRuns.add(key);
        const channel=guild.channels.cache.get(s.activity_channel_id);
        if(!channel?.isTextBased()) continue;
        const e=new EmbedBuilder().setTitle("🏷️ Ultra Tag — Daily Activity Check")
          .setDescription("**Daily activity check is now open.**\n\n"+s.activity_emoji+" React to this message to mark yourself active today.\nYou earn **25 XP + 10 coins** for checking in.")
          .addFields({name:"Date",value:todayDublin(),inline:true},{name:"Reaction",value:s.activity_emoji,inline:true},{name:"Time",value:String(s.activity_hour).padStart(2,"0")+":"+String(s.activity_minute).padStart(2,"0")+" Dublin",inline:true})
          .setColor(0x5865F2).setFooter({text:"Ultra Tag Assistant • Daily Activity System"}).setTimestamp();
        const message=await channel.send({embeds:[e]}); await message.react(s.activity_emoji).catch(()=>{});
      }catch(error){ console.error("[activity scheduler]",error); }
    }
  },{timezone:"Europe/Dublin"});

  cron.schedule("* * * * *",async()=>{
    for(const r of dueReminders()){
      try{ const c=await client.channels.fetch(r.channel_id); if(c?.isTextBased()) await c.send("⏰ <@"+r.user_id+"> reminder: **"+r.message+"**"); }
      catch(e){console.error("[reminder]",e)} finally{completeReminder(r.id)}
    }
  },{timezone:"Europe/Dublin"});
}
