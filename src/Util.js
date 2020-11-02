class Util {

    /**
     * <warn>This is a funny static class.</warn>
     */
    constructor() {
        throw new Error(`${this.constructor.name} May not be instantiated`);
    }

    /**
     * Parse milliseconds
     * @param {number} ms Milliseconds to parse
     * @returns {MS}
     */
    static ms(ms) {
        if (typeof ms !== "number") throw new Error(`Expected milliseconds to be a number, received ${typeof ms}!`);

        const apply = ms > 0 ? Math.floor : Math.ceil;
        return {
            days: apply(ms / 86400000),
            hours: apply(ms / 3600000) % 24,
            minutes: apply(ms / 60000) % 60,
            seconds: apply(ms / 1000) % 60,
            milliseconds: apply(ms) % 1000,
            microseconds: apply(ms * 1000) % 1000,
            nanoseconds: apply(ms * 1e6) % 1000
        }
    }

    /**
     * @typedef {object} MS
     * @property {number} days Days
     * @property {number} hours Hours
     * @property {number} minutes Minutes
     * @property {number} seconds Seconds
     * @property {number} milliseconds Milliseconds
     * @property {number} microseconds Microseconds
     * @property {number} nanoseconds Nanoseconds
     */

    /**
     * Returns cooldown time object
     * @param {number} cooldownTime Cooldown timeout
     * @param {number} collectedTime Collected timestamp
     * @returns {MS}
     */
    static getCooldown(cooldownTime, collectedTime) {
        if (cooldownTime instanceof Date) cooldownTime = cooldownTime.getTime();
        if (collectedTime instanceof Date) collectedTime = collectedTime.getTime();
        if (typeof cooldownTime !== "number") throw new Error(`Expected cooldownTime to be a number, received ${typeof cooldownTime}!`);
        if (typeof collectedTime !== "number") throw new Error(`Expected collectedTime to be a number, received ${typeof collectedTime}!`);

        if (collectedTime !== null && cooldownTime - (Date.now() - collectedTime) > 0) return Util.ms(cooldownTime - (Date.now() - collectedTime));
        return Util.ms(0);
    }

    /**
     * Checks for cooldown
     * @param {number} cooldownTime Cooldown timeout
     * @param {number} collectedTime Timestamp when last item was collected
     * @returns {boolean}
     */
    static onCooldown(cooldownTime, collectedTime) {
        if (cooldownTime instanceof Date) cooldownTime = cooldownTime.getTime();
        if (collectedTime instanceof Date) collectedTime = collectedTime.getTime();
        if (typeof cooldownTime !== "number") throw new Error(`Expected cooldownTime to be a number, received ${typeof cooldownTime}!`);
        if (typeof collectedTime !== "number") throw new Error(`Expected collectedTime to be a number, received ${typeof collectedTime}!`);

        if (collectedTime !== null && cooldownTime - (Date.now() - collectedTime) > 0) return true;
        return false;
    }

    /**
     * @typedef {object} ParsedKey
     * @property {string} prefix Key prefix
     * @property {?string} guildID Guild id
     * @property {string} userID User id
     */

    /**
     * Parse key
     * @param {string} key Data key
     * @returns {ParsedKey}
     */
    static parseKey(key) {
        if (!key) throw new Error("Invalid key");
        const chunk = key.split("_");
        if (chunk.length >= 3) {
            const obj = {
                prefix: chunk[0],
                guildID: chunk[1],
                userID: chunk[2]
            };

            return obj;
        } else {
            const obj = {
                prefix: chunk[0],
                guildID: null,
                userID: chunk[1]
            };

            return obj;
        }
    }

    /**
    * Makes key
    * @param {string} user User id
    * @param {string} guild Guild id
    * @param {string} prefix Prefix
    * @returns {string}
    */
    static makeKey(user, guild, prefix) {
        return `${prefix}_${guild ? guild + "_" : ""}${user}`;
    }

    /**
     * Returns random number
     * @param {number} from inclusive number
     * @param {number} to exclusive number
     * @returns {number}
     */
    static random(from, to) {
        if (typeof from !== "number" || typeof to !== "number") return 0;
        const amt = Math.floor(Math.random() * (to - from + 1)) + from;
        return amt;
    }

    /**
     * @typedef {object} CooldownTable
     * @property {number} DAILY Cooldown for daily
     * @property {number} WEEKLY Cooldown for weekly
     * @property {number} WORK Cooldown for work
     * @property {number} BEG Cooldown for beg
     * @property {number} MONTHLY Cooldown for monthly
     * @property {number} SEARCH Cooldown for search
     */

    /**
     * Default Cooldown table
     * @type {CooldownTable}
     */
    static get COOLDOWN() {
        return {
            DAILY: 86400000,
            WEEKLY: 604800000,
            WORK: 2700000,
            BEG: 60000,
            MONTHLY: 2628000000,
            SEARCH: 300000
        };
    }

    /**
     * @typedef {object} MySQLOptions
     * @property {string} [table="money"] Table name
     * @property {string} database Database
     * @property {string} user Database user info
     * @property {string} password Database password
     * @property {string} host Database host
     * @property {number} [port=3306] Database PORT
     * @property {object} [additionalOptions={}] Additional options
     */

    /**
     * Mysql Options
     * @type {MySQLOptions}
     */
    static get MYSQL_OPTIONS() {
        return {
            table: 'money',
            database: '',
            user: '',
            password: '',
            host: '',
            port: 3306,
            additionalOptions: {}
        }
    }

    /**
     * @typedef {object} MongoOptions
     * @property {string} [schema="userBalance"] Schema/Model name
     * @property {string} [collection="money"] Collection name
     * @property {object} [additionalOptions={}] Additional options
     */

    /**
     * Mongo options
     * @type {MongoOptions}
     */
    static get MONGO_OPTIONS() {
        return {
            schema: 'userBalance',
            collection: 'money',
            additionalOptions: {}
        }
    }

    /**
     * @typedef {object} SQLiteOptions
     * @property {string} [table="money"] Table name
     * @property {string} [filename="eco"] File name
     * @property {object} [sqliteOptions={}] SQLite options
     */

    /**
     * SQLite Options
     * @type {SQLiteOptions}
     */
    static get SQLITE_OPTIONS() {
        return {
            table: 'money',
            filename: 'eco',
            sqliteOptions: {}
        }
    }
};

module.exports = Util;