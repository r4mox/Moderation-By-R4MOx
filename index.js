const { CommandoClient } = require('discord.js-commando');
const { Structures, MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');
const { prefix, token, discord_owner_id } = require('./config.json');
const db = require('quick.db');
const Canvas = require('canvas');

Structures.extend('Guild', function(Guild) {
  class MusicGuild extends Guild {
    constructor(client, data) {
      super(client, data);
      this.musicData = {
        queue: [],
        queueHistory: [],
        isPlaying: false,
        nowPlaying: null,
        songDispatcher: null,
        skipTimer: false, // only skip if user used leave command
        loopSong: false,
        loopQueue: false,
        volume: 1
      };
      this.triviaData = {
        isTriviaRunning: false,
        wasTriviaEndCalled: false,
        triviaQueue: [],
        triviaScore: new Map()
      };
    }
    resetMusicDataOnError() {
      this.musicData.queue.length = 0;
      this.musicData.isPlaying = false;
      this.musicData.nowPlaying = null;
      this.musicData.loopSong = false;
      this.musicData.loopQueue = false;
      this.musicData.songDispatcher = null;
    }
  }
  return MusicGuild;
});

const client = new CommandoClient({
  commandPrefix: prefix,
  owner: discord_owner_id
});

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ['music', ':notes: Music Command Group:'],
    ['gifs', ':film_frames: Gif Command Group:'],
    ['other', ':loud_sound: Other Command Group:'],
    ['guild', ':gear: Guild Related Commands:'],
    ['speedrun', ':athletic_shoe: Speedrun Related Commands:']
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    eval: false,
    prefix: false,
    commandState: false
  })
  .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
  console.log(`${client.user.tag} is Ready!`);
  client.user.setActivity(`${prefix}help`, {
    type: 'WATCHING',
    url: 'https://github.com/galnir/Master-Bot'
  });
  const Guilds = client.guilds.cache.map(guild => guild.name);
  console.log(Guilds, 'Connected!');
  // Registering font For Cloud Services
  Canvas.registerFont('./resources/welcome/OpenSans-Light.ttf', {
    family: 'Open Sans Light'
  });
});
client.on('voiceStateUpdate', async (___, newState) => {
  if (
    newState.member.user.bot &&
    !newState.channelID &&
    newState.guild.musicData.songDispatcher &&
    newState.member.user.id == client.user.id
  ) {
    newState.guild.musicData.queue.length = 0;
    newState.guild.musicData.songDispatcher.end();
    return;
  }
  if (
    newState.member.user.bot &&
    newState.channelID &&
    newState.member.user.id == client.user.id &&
    !newState.selfDeaf
  ) {
    newState.setSelfDeaf(true);
  }
});

client.on('guildMemberAdd', async member => {
  //Grab DB 1 get
  const serverSettingsFetch = db.get(member.guild.id);
  if (!serverSettingsFetch || serverSettingsFetch == null) return;

  const welcomeMsgSettings = serverSettingsFetch.serverSettings.welcomeMsg;
  if (welcomeMsgSettings == undefined) return;

  if (welcomeMsgSettings.status == 'no') return;

  if (welcomeMsgSettings.status == 'yes') {
    var applyText = (canvas, text) => {
      const ctx = canvas.getContext('2d');
      let fontSize = 70;

      do {
        ctx.font = `${(fontSize -= 10)}px Open Sans Light`; // This needs to match the family Name on line 65
      } while (ctx.measureText(text).width > canvas.width - 300);

      return ctx.font;
    };

    // Customizable Welcome Image Options
    var canvas = await Canvas.createCanvas(
      welcomeMsgSettings.imageWidth,
      welcomeMsgSettings.imageHeight
    );
    var ctx = canvas.getContext('2d');

    // Background Image Options
    var background = await Canvas.loadImage(welcomeMsgSettings.wallpaperURL);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Background Image Border Options
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Upper Text Options
    ctx.font = '26px Open Sans Light'; // if the font register changed this needs to match the family Name on line 65
    ctx.fillStyle = '#FFFFFF'; // Main Color of the Text on the top of the welcome image
    ctx.fillText(
      welcomeMsgSettings.topImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `Welcome to ${member.guild.name}`),
      canvas.width / 2.5,
      canvas.height / 3.5
    );
    ctx.strokeStyle = `#FFFFFF`; // Secondary Color of Text on the top of welcome for depth/shadow the stroke is under the main color
    ctx.strokeText(
      welcomeMsgSettings.topImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `Welcome to ${member.guild.name}`),
      canvas.width / 2.5,
      canvas.height / 3.5
    );

    //Lower Text Options
    ctx.font = applyText(canvas, `${member.displayName}!`);
    ctx.fillStyle = '#FFFFFF'; // Main Color for the members name for the welcome image
    ctx.fillText(
      welcomeMsgSettings.bottomImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `${member.displayName}!`),
      canvas.width / 2.5,
      canvas.height / 1.8
    );
    ctx.strokeStyle = `#FF0000`; // Secondary Color for the member name to add depth/shadow to the text
    ctx.strokeText(
      welcomeMsgSettings.bottomImageText
        .replace(/\{serverName\}/gi, member.guild.name)
        .replace(/\{memberName\}/gi, member.displayName)
        .replace('default', `${member.displayName}!`),
      canvas.width / 2.5,
      canvas.height / 1.8
    );

    // Avatar Shape Options
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true); // Shape option (circle)
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({
        format: 'jpg'
      })
    );
    ctx.drawImage(avatar, 25, 25, 200, 200);
    // Image is Built and Ready
    const attachment = new MessageAttachment(
      canvas.toBuffer(),
      'welcome-image.png'
    );

    // Welcome Embed Report
    var embed = new MessageEmbed()
      .setColor(`RANDOM`)
      .attachFiles(attachment)
      .setImage('attachment://welcome-image.png')
      .setFooter(`Type help for a feature list!`)
      .setTimestamp()
      .setTitle(
        welcomeMsgSettings.embedTitle
          .replace(/\{serverName\}/gi, member.guild.name)
          .replace(/\{memberName\}/gi, member.displayName)
          .replace(
            'default',
            `:speech_balloon: Hey ${member.displayName}, You look new to ${member.guild.name}!`
          )
      );

    // Sends a DM if set to or if destination is not present in DB(pre channel option users)
    if (
      welcomeMsgSettings.destination == 'direct message' ||
      !welcomeMsgSettings.destination
    )
      try {
        await member.user.send(embed);
      } catch {
        console.log(`${member.user.username}'s dms are private`);
      }

    // Sends to assigned Channel from DB
    if (welcomeMsgSettings.destination != 'direct message') {
      const channel = member.guild.channels.cache.find(
        channel => channel.name === welcomeMsgSettings.destination
      );
      await channel.send(`${member}`);
      await channel.send(embed);
    }
  }
});

client.login(token);

client.on("message", message => {
  if (message.content.startsWith(PREFIX + "animal")) {
    let man = [
      "https://cdn.discordapp.com/attachments/608711488806584330/823219504578166834/Gif_Pack_-_HostleCreative_73.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/788719341650051082/image0.gif",
      "https://cdn.discordapp.com/attachments/659108301690372108/753036329700556820/hym.gif",
      "https://cdn.discordapp.com/attachments/608711488806584330/827973064956051476/c9e8306166bf97a20f14fc6093861d8c.gif",
      "https://cdn.discordapp.com/attachments/608711488806584330/809648267091771392/image1.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/801938698412621844/image1.gif",
      "https://cdn.discordapp.com/attachments/608711488806584330/832917963061461042/291359420049201.gif",
      "https://cdn.discordapp.com/attachments/659108301690372108/782973562251378718/oxytyche_17.gif",
      "https://cdn.discordapp.com/attachments/608711488806584330/823559629475807232/1464342173-cute-puppy-gif.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/791927311342632980/image0.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/791681658532266024/image0.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/801939015061602344/image0.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/791927410131206164/image0.gif",
      "https://cdn.discordapp.com/attachments/608711488806584330/812304250247970856/tenor_73.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/780698342991593482/image0.gif",
      "https://cdn.discordapp.com/attachments/659108301690372108/785123256813617172/dvBgr7pA6FTJOMOALY.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/750275296024068156/image0.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/791927203671310366/image0.gif",
      "https://cdn.discordapp.com/attachments/659108301690372108/830922706945441892/7223f242debe0af5ac2ab1b9b1dce93a-5.gif",
      "https://cdn.discordapp.com/attachments/737807699412254811/791681662910988298/image0.gif"
    ];

    message.channel
      .send({
        embed: {
          description: `**Gif Animal**`,
          footer: `Requested by ${message.author.username}`,
          color: `#FFF712`,
          image: {
            url: man[Math.floor(Math.random() * man.length)]
          }
        }
      })

.catch(e => {
        client.log.error(e);
      });
  }
});
