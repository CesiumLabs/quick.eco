const db = require("quick.db");
const { EventEmitter } = require("events");

/**
 * LotteryManager - Simple LotteryManager class
 * This class can be used to create lottery system in your bot
 */
class LotteryManager extends EventEmitter {

    /**
      * @constructor
      * @param {Object} options - Lottery Options
      * @param [options.lotteryInterval] - Lottery Interval, time in minutes.
      * @param [options.checkInterval] - Lottery check interval, time in seconds
      */
    constructor(options = {}) {
        super();
        this._started = false;
        this.db = db;
        this.startedAt = Date.now();
        this.options = Object.assign({
            lotteryInterval: 60, // mins
            checkInterval: 60 // seconds
        }, options);
    }

    /**
      * starts the lotteryManager
      */
    start() {
        this._started = true;
        this.emit('ready');
        if(!this.db.fetch('lastStarted')) this.db.set('lastStarted', Date.now());
        return this._start();
    }
    
    /**
      * registers the user in lottery
      * @param {String} id - ID of a user, generally a Snowflake
      */
    registerUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new TypeError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        lotteryDB.push(id);
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryCreate', id);
        if(!emitted) return true;
    }

    /**
      * removes a user
      * @param {String} User id
      */
    removeUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new TypeError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        const index = lotteryDB.indexOf(id);
        if(index < 0) {
            let emitted = this.emit('error', `${id} is not enrolled.`);
            if(!emitted) throw new TypeError(`${id} is not enrolled.`);
        }
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryDelete', id);
        if(!emitted) return true;
        return;
    }

    /**
      * get all registed users
      */
    get users() {
        return (this.db.fetch('lottery') || []);
    }
    
    /**
      * @ignore
      * Starter
      */
    _start() {
        if(!this._started) return;
        const checkInterval = this.checkInterval * 1000;
        const lotteryInterval = this.lotteryInterval * 60 * 1000;
        setInterval(() => {
            let lastEnded = this.db.fetch('lastEnded') || this.startedAt;
            let lastStarted = this.db.fetch('lastStarted');
            if(!lastEnded && lastStarted) {
                lastEnded = lastStarted;
                this.emit("resume", (this.db.fetch("lottery") || []));
            }
            if(Date.now() - lastEnded > lotteryInterval) {
                const lotteryDB = this.db.fetch('lottery') || [];
                if (lotteryDB.length < 1) return this.emit("error", "No user participated");
                let randomUser = lotteryDB[Math.floor(Math.random() * lotteryDB.length)];
                this.emit('end', (randomUser, lotteryDB));
                this.db.set("lottery", []);
                this.db.set('lastEnded', Date.now());
                this.start();
            }
        }, checkInterval);
    }

}

module.exports = LotteryManager;
