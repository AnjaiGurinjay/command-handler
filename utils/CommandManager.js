const { BaseClient } = require('../structures/BaseClient');
const { promises } = require('fs');
const { Collection } = require('discord.js');
const { resolve } = require('path');

class CommandManager extends Collection {
    constructor(client = BaseClient, path = String) {
        super();

        this.client = client;
        this.path = path;
        this.categories = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
    }

    async load() {
        promises.readdir(resolve(this.path))
        .then(async categories => {
            this.client.logger.info(`Found ${categories.length} categories, registering...`);
            for (const category of categories) {
                const metaConf = await require(resolve(this.path, category, 'category.meta.json'));
                if (metaConf) { 
                    metaConf.path = resolve(this.path, category);
                    metaConf.cmds = [];
                    this.categories.set(category, metaConf);
                    this.client.logger.info(`Registering ${category} category...`);
                    await promises.readdir(resolve(this.path, category))
                    .then(files => files.filter(f => f !== 'category.meta.json'))
                    .then(async files => {
                        this.client.logger.info(`Found ${files.length} of commands in ${category}, loading...`);
                        for (const file of files) {
                            const prop = await require(resolve(this.path, category, file));
                            prop.path = resolve(this.path, category, file);
                            prop.category = category;
                            this.set(prop.name, prop);
                            if (prop.aliases && Array.isArray(prop.aliases)) prop.aliases.forEach(alias => this.aliases.set(alias, prop.name));
                            this.client.logger.info(`Command ${prop.name} from ${category} category is now loaded.`);
                        }
                        return { files };
                    })
                    .then(data => {
                        this.categories.set(category, Object.assign(metaConf, { cmds: this.filter(x => x.category === category )}))
                        this.client.logger.info(`Done loading ${data.files.length} commands in ${category} category.`)
                    })
                    .catch(err => this.client.logger.error(`CMD_LOADER_ERR:`, err))
                    .finally(() => this.client.logger.info(`Done registering ${category} category.`));
                }
            }
        })
        .catch(err => this.client.logger.error(`CMD_LOADER_ERR:`, err))
        .finally(() => this.client.logger.info(`All categories has been registered.`));
    }

    async handle(message) {
        const args = message.content.slice(this.client.config.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        const command = this.get(cmd) || this.get(this.aliases.get(cmd));
        if (!command || command.disable) return undefined;

        if (!this.cooldowns.has(command.name)) this.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                message.channel.send(`Please wait **${timeLeft.toFixed(1)}** seconds.`).then(msg => {
                    setTimeout(() => msg.delete().catch(e => msg.client.logger.error(`PROMISE_ERR:`, e)), 3500);
                }).catch(e => message.client.logger.error(`PROMISE_ERR:`, e));
                return undefined;
            }
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else {
            timestamps.set(message.author.id, now);
            if (this.client.config.owners.includes(message.author.id)) timestamps.delete(message.author.id);
        }
        try {
            if (command.devOnly && !this.client.config.owners.includes(message.author.id)) return undefined;
            return command.run(this.client, message, args);
        } catch (err) {
            this.client.logger.error(`COMMAND_HANDLER_ERR:`, err);
        } finally {
            if (command.devOnly && !this.client.config.owners.includes(message.author.id)) return undefined;
            this.client.logger.info(`${message.author.tag} [${message.author.id}] using ${command.name} command from ${command.category} category`);
        }
    }
}

module.exports = { CommandManager: CommandManager };