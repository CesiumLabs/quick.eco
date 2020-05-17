const db = require("quick.db");

class LotteryManager {

  constructor(client, options={}) {
    if (!client) throw new Error("No client provided!");
    this.client = client;
  }

}

module.exports = LotteryManager;
