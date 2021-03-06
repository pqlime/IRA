const Discord = require("discord.js")
const utils = require("../utils/index.js")
const events = require("events")
const ytdl = require('ytdl-core');
const request = require('request');
var config = JSON.parse(require("fs").readFileSync("./cfg.json"));

var music = new events();
var ytID = require("get-youtube-id")
global.skip = false
global.playing = false
music.on("play", (message) =>{
  global.voteusers = []
  global.votes = 0
  if (!message.client.voiceConnections.first()) {
    return
  }

  if(message.client.voiceConnections.first().speaking) {
    message.client.voiceConnections.first().dispatcher.end('skip')
    global.queue.shift()
  }

  if(global.queue.length === 0) {
    message.channel.send({embed:utils.embed("happy", `Thanks for listening! I'm off.`)})
    message.client.voiceConnections.first().disconnect()
    global.playing = false
    return
  }

  var dispatcher = undefined;
  if (global.queue[0].type == "youtube") {
    let footer = ytID(global.queue[0]["url"])
    if(footer === null) footer = global.queue[0]["url"]
    message.channel.send({embed:utils.embed("happy", `Now playing \`${global.queue[0]["info"]}\` queued by \`${global.queue[0]["user"].username}\` with a length of \`${global.queue[0]["minutes"]}:${global.queue[0]["seconds"]}\` `, undefined, `https://youtu.be/${footer}`)})
    dispatcher = message.client.voiceConnections.first().playStream(ytdl(global.queue[0]["url"], {filter: 'audioonly'}), global.streamoptions)
  } 
  else if (global.queue[0].type == "soundcloud") {
    message.channel.send({embed:utils.embed("happy", `Now playing \`${global.queue[0]["info"]}\` queued by \`${global.queue[0]["user"].username}\` with a length of \`${global.queue[0]["minutes"]}:${global.queue[0]["seconds"]}\` `, undefined, global.queue[0].permalink_url)})
    dispatcher = message.client.voiceConnections.first().playStream(request(global.queue[0].url+"?client_id="+config.scid, (error, response) => {
      if (error || !response) {
        message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${error}\`\`\``,"RED")})
        dispatcher.end();
      } else if (/4\d\d/.test(response.statusCode) === true) { //idk what that regex expression or precicely what response.statusCode are. credit to https://github.com/boblauer/url-exists
        message.channel.send({embed:utils.embed("sad", "Hey, I can't find this thing.. Are you sure that's the right link?","RED")})
        dispatcher.end();
      }
    }), global.streamoptions)
  } 
  else { // A direct link to a audio file. Precursor to SoundCloud functionality.
      message.channel.send({embed:utils.embed("happy", `Now playing [${global.queue[0]["info"]}](${global.queue[0].url}) queued by \`${global.queue[0]["user"].username}\``, undefined, undefined)})
      dispatcher = message.client.voiceConnections.first().playStream(request(global.queue[0].url, (error, response) => {
        if (error || !response) {
          message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${error}\`\`\``,"RED")})
          dispatcher.end();
        } else if (/4\d\d/.test(response.statusCode) === true) { //idk what that regex expression or precicely what response.statusCode are. credit to https://github.com/boblauer/url-exists
          message.channel.send({embed:utils.embed("sad", "Hey, I can't find this thing.. Are you sure that's the right link?","RED")})
          dispatcher.end();
        }
      }), global.streamoptions)
  }
  global.playing = true
  dispatcher.on("debug", info => {
    console.log(`Debug from stream dispatcher: ${info}`);
  })
  dispatcher.on("end", reason => {
    console.log("neat")
    global.queue.shift()

  	setTimeout(function() {
      try{music.emit("play", message)}  catch(err) {
        message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
      } 
    }, 1000)
    
  })
})
music.on("end", (message) => {
  global.voteusers = []
  global.votes = 0
  global.queue = []
  try{music.emit("play", message)}  catch(err) {
    message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
  }
  global.streamoptions.volume = 0.25;
})
music.on("skip", (message) => {
    message.client.voiceConnections.first().dispatcher.end()
})
music.on("setVolume", (message) => {
  global.streamoptions.volume = message.content.split(" ")[1]
  if (message.client.voiceConnections.first().dispatcher)
    try {
      message.client.voiceConnections.first().dispatcher.setVolume(message.content.split(" ")[1]);
    } catch (err) {
      message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
    }
})

module.exports.events = music
module.exports.refresh = (message) => {
  global.queue = []
  global.voteusers = []
  global.votes = []
  global.playing = false
  if(message.client.voiceConnections.first() != undefined) {
    try{music.emit("play", message)}  catch(err) {
      message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
    }}
  music = null
  music = new events()
}

//global.queue.shift();
