const { resolve } = require('path');
const { formatMS } = require('../utils/formatMS');
const { ClientLogger } = require('../utils/ClientLogger');
const { CommandManager } = require('../utils/CommandManager');
const { ListenersLoader } = require('../utils/ListenersLoader');
const { Client } = require('discord.js');

class BaseClient extends Client {
    constructor(opts) {
        super(opts);

        this.commands = new CommandManager(this, resolve(__dirname, '..', 'commands'));
        this.listeners = new ListenersLoader(this, resolve(__dirname, '..', 'listeners'));
        this.logger = new ClientLogger({ pord: true });
        this.config = require('../config');
        this.package = require('../package');
    }

    async build(token) {
        const start = Date.now();
        this.listeners.load();
        this.on('ready', async() => {
            await this.commands.load();
            this.logger.info(`Ready took ${formatMS(Date.now() - start)}`);
        });
        await this.login(token);
        return this;
    }
}

module.exports = { BaseClient: BaseClient };