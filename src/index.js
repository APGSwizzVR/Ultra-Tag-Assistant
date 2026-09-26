import {Client,GatewayIntentBits,Partials,Events,ActivityType,EmbedBuilder} from "discord.js";
import {config} from "./config.js";
import {ensureSettings,getSettings,recordActivity,recordMessage} from "./database.js";
import {handleCommand} from "./commands.js";
import {startSchedulers} from "./scheduler.js";
import {success} from "./utils.js";

const client=new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMessageReactions,GatewayIntentBits.MessageContent],
  partials:[Partials.Message,Partials.Channel,Partials.Reaction]
});

client.once(Events.ClientReady,ready=>{
  console.log("[Ultra Tag Assistant] Logged in as "+ready.user.tag);
  for(const g of ready.guilds.cache.values())ensureSettings(g.id);
  ready.user.setPresence({activities:[{name:"Ultra Tag",type:ActivityType.Playing}],status:"online"});
  startSchedulers(client);
});

client.on(Events.InteractionCreate,async i=>{if(i.isChatInputCommand())await handleCommand(i,client);});

client.on(Events.MessageCreate,m=>{if(m.guild&&!m.author.bot)recordMessage(m.guild.id,m.author.id);});

client.on(Events.MessageReactionAdd,async(reaction,user)=>{
  if(user.bot)return;
  try{
    if(reaction.partial)await reaction.fetch();
    const m=reaction.message;if(!m.guild)return;
    const s=getSettings(m.guild.id);
    if(!s?.activity_channel_id||m.channel.id!==s.activity_channel_id||reaction.emoji.name!==s.activity_emoji)return;
    const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Dublin",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if(recordActivity(m.guild.id,user.id,date,m.id)){
      await user.send({embeds:[success("Daily activity recorded","Your Ultra Tag check has been recorded. You earned **25 XP + 10 coins**.")] }).catch(()=>{});
    }
  }catch(e){console.error("[reaction]",e);}
});

client.on(Events.GuildMemberAdd,async member=>{
  try{
    const s=getSettings(member.guild.id),ch=s?.welcome_channel_id?member.guild.channels.cache.get(s.welcome_channel_id):null;
    if(ch?.isTextBased()){
      const e=new EmbedBuilder().setTitle("🏷️ Welcome to Ultra Tag").setDescription("Welcome <@"+member.id+">!\n\nCheck the rules, meet the community and get ready to play **Ultra Tag**.").setColor(0x5865F2).setThumbnail(member.user.displayAvatarURL({size:256})).setFooter({text:"Ultra Tag Assistant"}).setTimestamp();
      await ch.send({embeds:[e]});
    }
    if(s?.welcome_role_id){const role=member.guild.roles.cache.get(s.welcome_role_id);if(role)await member.roles.add(role).catch(()=>{});}
  }catch(e){console.error("[welcome]",e);}
});

client.on(Events.Error,e=>console.error("[discord]",e));
process.on("unhandledRejection",e=>console.error("[unhandledRejection]",e));
process.on("uncaughtException",e=>console.error("[uncaughtException]",e));
await client.login(config.token);
