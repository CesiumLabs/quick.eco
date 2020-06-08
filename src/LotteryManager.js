const EcoError = require("./Error");
const db = require("rex.db");
db.init("./economy");
const { EventEmitter } = require("events");
const User = require("./User.js");

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
        this.startedAt = 0;
        this.options = Object.assign({
            lotteryInterval: 60, // mins
            checkInterval: 60 // seconds
        }, options);
        // this.lotteryInterval = options.lotteryInterval || 60; // mins
        // this.checkInterval = options.checkInterval || 60; // seconds
    }

    /**
      * starts the lotteryManager
      * @fires LotteryManager#ready
      */
    static start() {
        this._started = true;
        this.startedAt = Date.now();
        if(!this.db.fetch('lastStarted') || this.db.fetch("lastStarted") == null) this.db.set('lastStarted', Date.now());
        this._start();
        this.emit("ready");
        return true;
    }
    
    /**
      * registers the user in lottery
      * @param {String} id - ID of a user, generally a Snowflake
      * @fires LotteryManager#entryCreate
      */
    static registerUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new EcoError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        lotteryDB.push(id);
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryCreate', new User(id));
        if(!emitted) return true;
    }

    /**
      * removes a user
      * @param {String} User id
      * @fires LotteryManager#entryDelete
      */
    static removeUser(id) {
        if(!id) {
            let emitted = this.emit('error', `User ID was not provided.`);
            if(!emitted) throw new EcoError(`User ID was not provided.`);
        }
        let lotteryDB = this.db.fetch('lottery') || [];
        if (!lotteryDB.includes(id)) {
            let emitted = this.emit('error', `${id} is not enrolled.`);
            if(!emitted) throw new EcoError(`${id} is not enrolled.`);
        }
        lotteryDB.splice(lotteryDB.indexOf(id), 1);
        this.db.set('lottery', lotteryDB);
        let emitted = this.emit('entryDelete', new User(id));
        if(!emitted) return true;
    }

    /**
      * get all registed users
      * @returns Array
      */
    static get users() {
        return (this.db.fetch('lottery').map(m => new User(m)) || []);
    }


    /**
      * forcefully end the lottery
      * @returns Boolean
      */
    static end() {
        if (!this._started) return false;
        let u = this.db.get("lottery");
        if (!u || u == null || u.length < 1) {
            let emitted = this.emit("error", "No user particilated");
            if (!emitted) throw new EcoError("No user participated");
            return;
        }
        let Winner = u[Math.floor(Math.random() * u.length)];
        this.emit("end", (new User(Winner), u.map(u => new User(u))));
        this.db.delete('lottery');
        this.db.set('lastEnded', Date.now());
        this._started = false;
        this.startedAt = 0;
        return true;
    }
    
    /**
      * @ignore
      * @private
      * Lottery Starter
      */
    _start() {
        if(!this._started) return false;
        const checkInterval = this.options.checkInterval * 1000;
        const lotteryInterval = this.options.lotteryInterval * 60 * 1000;
        // return;
        setInterval(() => {
            let lastEnded = this.db.fetch('lastEnded') || this.startedAt;
            let lastStarted = this.db.fetch('lastStarted');
            if(!lastEnded && lastStarted) {
                lastEnded = lastStarted;
            }
            if((Date.now() - lastEnded) > lotteryInterval) {
                const lotteryDB = this.db.fetch('lottery') || [];
                if (lotteryDB.length < 1) return this.emit("error", "No user participated");
                let randomUser = lotteryDB[Math.floor(Math.random() * lotteryDB.length)];
                this.emit('end', new User(randomUser), lotteryDB.map(w => new User(w)));
                this.db.set('lastEnded', Date.now());
                this.db.delete('lottery');
                this.start();
            }
        }, checkInterval);
    }

}

/**
  * Emitted whenever the LotteryManager becomes ready
  * @event LotteryManager#ready
  */

/**
  * Emitted whenever error occurs
  * @event LotteryManager#error
  * @param {Error} error
  */

/**
  * Emitted whenever a user is registered
  * @event LotteryManager#entryCreate
  * @param {User} user registered
  */

/**
  * Emitted whenever a user is removed from the lottery
  * @event LotteryManager#entryDelete
  * @param {User} removed user
  */

/**
  * Emitted whenever lottery ends
  * @event LotteryManager#end
  * @param {String} winner - Lottery Winner
  * @param {Array} entries - Array of the entries
  * @example lotrery.on("end", (winner, entries) => console.log(winner + " won the lottery. Total "+ entries.length + " participated!");
  */

module.exports = LotteryManager;
