const { formatDuration, intervalToDuration } = require('date-fns');
const locales = require('date-fns/locale');

module.exports = {
    formatMS: function formatMS(ms) {
        if (isNaN(ms)) throw new Error('Value is not a number!');

        const key = Object.keys(locales).find(v => v.toLowerCase() === 'en'.toLowerCase());
        const locale = key ? locales[key] : locales.enUS;

        return formatDuration(intervalToDuration({ start: 0, end: ms }), {
            locale
        });
    }
}