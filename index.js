const { BaseClient } = require('./structures/BaseClient');
const client = new BaseClient();

client.build(client.config.token)
    .catch(err => client.logger.error(`PROMISE_ERR:`, err));