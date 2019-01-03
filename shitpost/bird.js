const Discord = require("discord.js")
var utils = require("../utils/index.js")
const request = require("request")
module.exports = {
  name:"!bird",
  desc:"a nice bird for your eye-holes",
  shitpost:true,
  func:function(message){
    request('http://shibe.online/api/birds?count=1&urls=true', (error, response, body) => {
    	  if (error) { //request error case
          	message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${error}\`\`\``,"RED")})
        }
        try {
        	 message.channel.send(new Discord.RichEmbed().setImage(JSON.parse(body)[0]));
        } catch (err) {
        	 message.channel.send({embed:utils.embed("malfunction", `Something went wrong! \`\`\`${err}\`\`\``,"RED")})
        }
    })
  }
}