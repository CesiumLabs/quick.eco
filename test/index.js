const Eco = require("../index");
const { Database } = require("quickmongo");
const db = new Database("mongodb://localhost/quickeco");

class CustomManager extends Eco.Manager {

    initDatabase(force = false) {
        return new Promise((resolve) => {
            // to wipe out data
            if (force) {
                db.deleteAll();
                resolve(true);
            } else {
                // don't forget to return something
                resolve(true);
            }
        });
    }

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
            prev.forEach(x => db.set(x.ID, x.data));
            resolve(prev);
        });
    }

    read(id) {
        return new Promise(async (resolve) => {
            let json = await db.all();
            if (!!id && typeof id === "string") return resolve(json.filter(x => x.ID === id) || null);
            return resolve(json);
        });
    }

}

db.once("ready", () => {
    const eco = new Eco.EconomyManager({
        useDefaultManager: false
    }, CustomManager);

    eco.beg("16").then(console.log);
});