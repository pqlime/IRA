const Discord = require("discord.js")
const client = new Discord.Client()
const fs = require('fs');
const eventEmitter = require('events');
// CONFIG DETERMINATION (reads different files with 'live' or 'dev' command line param)
var config;
if (process.argv.length > 2) {
  switch (process.argv[2]) {
    case ("live"): {config = JSON.parse(fs.readFileSync("./cfg_live.json")); break};
    case ("dev"): {config = JSON.parse(fs.readFileSync("./cfg_dev.json")); break};
    default: config = JSON.parse(fs.readFileSync("./cfg.json"));
  } 
} else config = JSON.parse(fs.readFileSync("./cfg.json"));
//IRA HANDLER
const ira = new eventEmitter()
//local VARIABLES
var limitusers = []
//GLOBAL VARIABLES
global.queue = []
global.votes = 0
global.voteusers = []
global.pollobject = JSON.parse(fs.readFileSync("./poll.json"))
global.streamoptions = {volume:0.25, bitrate:'auto'}
global.blacklist = [];
global.config = config;
global.client = client;
//modules
var general = require("./general/index.js")
var utils = require("./utils/index.js")
var shitpost = require("./shitpost/index.js")
var mod = require("./mod/index.js")
var music = require("./music/index.js")
var botmanage = require("./botmanage/index.js")
var logs = require("./events/logs/index.js")
var poll = require("./events/poll.js")
//RELOAD FUNC
function shutdown(message) {
  message.channel.send({embed:utils.embed("happy", "Good night!")})
  fs.writeFileSync("./shutdownstatus.json", `{"shutdown":true}`)
  client.destroy().then((function() {process.exit()}));
}
function reload(arg, message) {
    if(config.owners.includes(message.author.id)) {
      arg = message.content.split(" ")[1]
      switch (arg) {
        case "general":
          general.refresh()
          delete require.cache[require.resolve('./general/index.js')];
          general = require('./general/index.js');
          embed = utils.embed("happy", `Reloaded module ${arg}`)
          message.channel.send({embed})
          break;
        case "shitpost":
          shitpost.refresh()
          delete require.cache[require.resolve('./shitpost/index.js')]
          shitpost = require('./shitpost/index.js')
          embed = utils.embed("happy", `Reloaded module ${arg}`)
          message.channel.send({embed})
          break;
        case "mod":
          mod.refresh()
          delete require.cache[require.resolve('./mod/index.js')]
          mod = require('./mod/index.js')
          embed = utils.embed("happy", `Reloaded module ${arg}`)
          message.channel.send({embed})
          break;
        case "music":
          music.refresh(message)
          delete require.cache[require.resolve('./music/index.js')]
          music = require('./music/index.js')
          embed = utils.embed("happy", `Reloaded module ${arg}`)
          message.channel.send({embed})
          break;
        case "logs":
          logs.refresh()
          delete require.cache[require.resolve('./events/logs/index.js')]
          logs = require('./events/logs/index.js')
          message.channel.send({embed:utils.embed("happy", `Reloaded module ${arg}`)})
          break;
        case "poll":
          delete require.cache[require.resolve('./events/logs/index.js')]
          poll = null
          poll = require('./events/poll.js')
          break;
        case "utils":
          utils.refresh()
          delete require.cache[require.resolve('./utils/index.js')]
          utils = require('./utils/index.js')
          message.channel.send({embed:utils.embed("happy", `Reloaded module ${arg}`)})
          break;
        default:
            message.channel.send({embed:utils.embed("malfunction", "Invalid Option")})
          }

      }
     else {message.channel.send({embed:utils.embed("malfunction", "You dont have permission for this command")})}
}
//EVAL FUNC
function evalcmd(message) {


let content = message.content.substr(message.content.split(" ")[0].length + 1)
  let evalresponse
    try {
      evalresponse = eval(content)
    } catch(err) {
      return message.channel.send("An Error Occured with the input " + content + "\n ```" + err.stack + "```")
    } 
    if(evalresponse === undefined) {return message.channel.send("```undefined```")} 
    else if (evalresponse === null) {message.channel.send("```null```")} 
    else {
      message.channel.sendMessage({embed:utils.embed("happy", `Eval response:\`\`\`${evalresponse.toString()}\`\`\``)})
    }

}
//READY EVENT
client.on("ready", () => {
 if(JSON.parse(fs.readFileSync("./shutdownstatus.json")).shutdown === false){
    client.guilds.get(config.guildid).channels.get(config.heartbeat).send({embed:utils.embed("malfunction", "Ouch.. Did something happen? I don't think I was supposed to go out there...")})} else {
   client.guilds.get(config.guildid).channels.get(config.heartbeat).send({embed:utils.embed("happy", `Good morning! Let's see.. I'm on version ${config.version} today.`)})
   fs.writeFile("./shutdownstatus.json", `{"shutdown":false}`, (err) => {})
 }
global.pollobject = JSON.parse(fs.readFileSync("./poll.json"))

 if(global.pollobject.pollmessage != null) {
   client.guilds.get(config.guildid).channels.get(global.pollobject["pollchan"]).fetchMessage(global.pollobject.pollmessage)
 }
 if(client.guilds.get(config.guildid).me.voiceChannel) {
   
   client.guilds.get(config.guildid).me.voiceChannel.leave()
 }
})

//COMMAND HANDLER
client.on("message", message => {

  if(client.user.id == message.author.id) return
  if(!message.content.startsWith("!")) return
  if(message.content == "!") return
  if(global.blacklist.includes(message.author.id)) return
  let command = message.content.split(config.prefix)[1]
        .split(" ")[0]
        .replace(" ", "")
        .toLowerCase();
  if(!command) return;
  if(command === "reload") return reload(message.content.split(" ")[1], message)
  if(command === "eval" && config.owners.includes(message.author.id)) return evalcmd(message)
  if(command === "shutdown" && config.owners.includes(message.author.id)) return shutdown(message)
  let ran = false
  fs.readdir("./general", function(err, items) {
    if(err) {
      error(message, err)
    } else {
      let commands = items.map(r => r.slice(0, -3))
          commands.splice(commands.indexOf("index"), 1)
      if(commands.includes(command)) {
        if(limitusers.includes(message.author.id)) return message.channel.send({embed:utils.embed("angry", `Wait up, I don't want to trip any breakers.`)}).then((message) => {
          setTimeout(function() {
            message.delete()
          }, config.ratelimitmessage)
          ran = true
        })
        try {
        general[command].func.call(client, message)
        ira.emit("ratelimit", message.author)
      }catch(err) {
        var embed = utils.embed(`malfunction`,`Something went wrong! \`\`\`${err}\`\`\``, "RED")
        message.channel.send({embed})
      }
        ran = true
      }
    }
  })

  fs.readdir("./shitpost", function(err, items) {
    if(err) {
      error(message, err)
    } else {
      let commands = items.map(r => r.slice(0, -3))
          commands.splice(commands.indexOf("index"), 1)

      if(true) {
        if(commands.includes(command)) {
          try {shitpost[command].func.call(client, message)
          } catch (err){
            var embed = utils.embed(`malfunction`,`Something went wrong! \`\`\`${err}\`\`\``, "RED")
          message.channel.send({embed})}}
        ran = true
      }
    }
  })
  fs.readdir("./mod", function(err, items) {
    if(err) {
      error(message, err)
    } else {
      let commands = items.map(r => r.slice(0, -3))
          commands.splice(commands.indexOf("index"), 1)
      if(commands.includes(command)) {
        if(message.member.roles.has(config.modrole)) {
          try{mod[command].func.call(client, message)}catch(err){message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``, "RED")})}
        }
      }
  }})

  fs.readdir("./botmanage", function(err, items) {
    if(err) {
      error(message, err)
    } else {
      let commands = items.map(r => r.slice(0, -3))
          commands.splice(commands.indexOf("index"), 1)
      if(commands.includes(command)) {
        if(message.member.roles.has(config.modrole) || config.owners.includes(message.author.id)) {
          try{botmanage[command].func.call(client, message)}catch(err){message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``, "RED")})}
        }
      }
  }})

  fs.readdir("./music", function(err, items) {
    if(err) {
      error(meesage, err)
    } else {
      let commands = items.map(r => r.slice(0, -3))
        commands.splice(commands.indexOf("index"), 1)


        if(commands.includes(command)) {
          if(limitusers.includes(message.author.id)) return message.channel.send({embed:utils.embed("angry", `Wait up, I don't want to trip any breakers.`)}).then((message) => {
            setTimeout(function() {
              message.delete()
            }, config.ratelimitmessage)
            ran = true
          })
          try {
          music[command].func.call(client, message)
          ira.emit("ratelimit", message.author)
        }catch(err) {
          var embed = utils.embed(`malfunction`,`Something went wrong! \`\`\`${err}\`\`\``, "RED")
          message.channel.send({embed})
        }
          ran = true
        }
    }
  })
})
//BOT HANDLER EVENTS
ira.on("ratelimit", (user) => {
  limitusers.push(user.id)
  setTimeout(function() {
    limitusers.splice(limitusers.indexOf(user.id))
  }, config.ratelimit)
})
//events and things
//Poll events



//I DONT FUCKING KNOW WHY IT WORKS LIKE THIS BUT NOT MODULAR I WAS SLEEP DEPRIVED WHEN I WROTE IT AND IT ONLY SEEMS TO WORK IN THESE EXACT CONDITIONS PLEASE HELP
//This is the only bit of code ive written that confuses me just cause it only works here but no where else even though there are no specific dependecies to the client and passing a user object should let me get the client object i honestly have no idea why it only works in this context it should work in modular form but guess what it doesnt even though it should i dont understand it SEND HELP

client.on("messageReactionAdd", (reaction, user) =>{
  global.pollobject = JSON.parse(fs.readFileSync("./poll.json"))
  if(user == client.user) return
  if(global.pollobject.pollmessage == null) return
  if(reaction.message.id === global.pollobject.pollmessage) {
    reaction.message.reactions.forEach(function(r) {
      r.fetchUsers().then(users => {
        if(reaction.emoji.name === r.emoji.name) return
        if(users.has(user.id)) {
          r.remove(user)
        }
      })
    })
  }

})

//LOGS OVER HERE
//log error function
function logerr(err) {
  client.guilds.get(config.guildid).channels.get(config.heartbeat).send({embed:utils.embed("malfunction", `Something's wrong with my logs. Know someone who can see what's up? \`\`\`${err}\`\`\``)})
}
//Log events
client.on("messageDelete", (message) => {
  try {logs.mdelete(message)}catch(err){logerr(err)}
})
client.on("guildMemberRemove", member => {
  try {logs.leave(member)}catch(err){logerr(err)}
})
client.on("guildBanAdd", (guild, user) => {
  try {logs.ban(user)}catch(err){logerr(err)}
})
client.on("guildBanRemove", (guild, user) => {
  try{logs.unbanned(user)}catch(err){logerr(err)}
})
client.on("messageUpdate", (OldMessage, NewMessage) => {
  try{logs.edit(OldMessage, NewMessage)}catch(err){logerr(err)}
})
client.login(config.token)
