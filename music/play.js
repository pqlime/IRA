var utils = require("../utils/index.js")
const Discord = require("discord.js")
var events = require("./index.js")

module.exports = {
  name:"!play",
  desc:"Plays the queue (Deprecated)",
  music:true,
  hidden:true,
  func:function(message){
    if(global.queue.length === 0) return message.channel.send({embed:utils.embed("sad","Theres no songs in the queue, add one with !add")})
    if(!message.guild.voiceConnection) return message.channel.send({embed:utils.embed("sad","I am not in a voice channel, add me in with !summon")})

    if(message.guild.voiceConnection.speaking || global.playing) return //message.channel.send({embed:utils.embed("angry", "Im already playing stuff")})
    try {events.events.emit("play", message)} catch(err) {
      message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
    }

  }
}
