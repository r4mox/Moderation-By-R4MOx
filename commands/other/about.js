const { Command } = require('discord.js-commando');

module.exports = class WhoMadeMeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'about',
      aliases: ['botinfo', 'whomademe', 'bot-maker', 'bot-creator'],
      memberName: 'about',
      group: 'other',
      description: "Learn about the bot and it's creator!"
    });
  }

  run(message) {
    message.channel.send(
      '\`\`\`diff For Any Quesstion About This Bot Send Message For @Ness・MrRobotᵇʰ#6067 On Dm\`\`\`'
    );
  }
};
