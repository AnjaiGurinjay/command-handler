const { BaseClient } = require('../structures/BaseClient');
const { resolve, parse } = require('path');
const { promises } = require('fs');

class ListenersLoader {
    constructor(client = BaseClient, path = String) {
        this.client = client;
        this.path = path;
    }

    load() {
        promises.readdir(resolve(this.path)).then(async listeners => {
            this.client.logger.info(`Loading ${listeners.length} listeners...`);
            for (const file of listeners) {
                const pull = await require(resolve(this.path, file));
                pull.event = pull.event || file.replace('.js', '');
                this.client.logger.info(`Listener on event ${pull.event.toString()} has been added.`);
                this.client.on(pull.event, pull.run.bind(null, this.client));
            }
        })
            .catch(err => console.error(err))
            .finally(() => this.client.logger.info(`Done loading listeners.`));
    }
}

module.exports = { ListenersLoader: ListenersLoader };