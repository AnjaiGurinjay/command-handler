const { format } = require('date-fns');

let color = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m'
}

class ClientLogger {
    constructor(opts = { prod: Boolean }) { this.opts = opts };

    info(...messages) {
        this.log(messages, 'info');
    }

    debug(...messages) {
        this.log(messages, 'debug');
    }

    error(...messages) {
        this.log(messages, 'error');
    }

    warn(...messages) {
        this.log(messages, 'warn');
    }

    log(messages, level) {
        if (this.opts.prod && level === 'debug') return;

        console[level](`${this.opts.prod ? '' : (level === 'debug' ? color.blue : (level === 'error' ? color.red : (level === 'warn' ? color.yellow : color.green)))}[${format(Date.now(), 'HH:mm')}] [${level.toLowerCase()}] > ${messages.map(x => String(x)).join(" ")} ${color.reset}`);
    }
}

module.exports = { ClientLogger: ClientLogger };