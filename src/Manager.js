const fs = require("fs");
const Defaults = {
    storage: "./quick.eco.json"
};

class Manager {

    /**
     * Quick.eco Manager
     * @param {object} ops Manager options
     * @param {string} [ops.storage] Storage path
     */
    constructor(ops) {
        if (ops) {
            if (typeof ops !== "object") ops = Defaults;
            if (!!ops.storage && typeof ops.storage !== "string") throw new Error("Invalid storage");
            if (!ops.storage.endsWith(".json")) throw new Error("Storage string must end with \".json\"!");

            /**
             * If the manager is custom
             */
            this.isCustomManager = false;
        } else {
            this.isCustomManager = true;
        }

        /**
         * Storage path
         * @type {string|null}
         */
        this.storage = ops ? ops.storage : null;

        this.initDatabase();
    }

    /**
     * Init database
     * @param {boolean} force If it should forcefully init database
     * @returns {Promise<boolean>}
     */
    initDatabase(force=false) {
        return new Promise((resolve, reject) => {
            if (!this.storage) return resolve(false);
            if (!fs.existsSync(this.storage) || !!force) {
                fs.writeFile(this.storage, "[]", (error) => {
                    if (error) return reject(error);
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    }

    /**
     * Writes data
     * @param {object} rdata Data to write
     * @returns {Promise<any[]>}
     */
    write(rdata) {
        return new Promise(async (resolve, reject) => {
            if (!rdata || typeof rdata !== "object") return reject(new Error("Invalid data"));
            let { ID, data } = rdata;
            if (!ID || typeof ID !== "string") return reject("Invalid data id!");
            if (typeof data === "undefined") data = null;

            let prev = await this.read();
            
            // remove existing
            prev = prev.filter(rs => rs.ID !== ID);

            // set data
            prev.push({
                ID: ID,
                data: data
            });

            fs.writeFile(this.storage, JSON.stringify(prev), (error) => {
                if (error) return reject(error);
                return resolve(prev);
            });
        });
    }

    /**
     * Reads database
     * @param {string} id Data id
     * @returns {Promise<any>}
     */
    read(id) {
        return new Promise(async (resolve, reject) => {
            fs.readFile(this.storage, "utf-8", (error, data) => {
                if (error) return reject(error);
                const json = JSON.parse(data);
                if (!!id && typeof id === "string") return resolve(json.filter(x => x.ID === id) || null);
                return resolve(json);
            });
        });
    }

}

module.exports = Manager;