module.exports.run = async (client, message) => {
    if(message.author.bot || !message.guild) return message;
    
    if(message.content.startsWith(client.config.prefix)) return client.commands.handle(message);
}