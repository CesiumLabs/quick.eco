export interface Adapter {
    name: string | undefined;
    options?: object;
}

export interface MySQLOptions {
    table?: string,
    database: string,
    user: string,
    password: string,
    host: string,
    port: number,
    additionalOptions?: object;
}

export interface MongoOptions {
    schema?: string;
    collection?: string;
    additionalOptions?: object;
}

export interface SQLiteOptions {
    table?: string;
    filename?: string;
    sqliteOptions?: object;
}

export type Adapters = | "sqlite" | "mongo" | "mysql" | undefined;

export interface Options {
    adapter: string;
    adapterOptions?: object;
    prefix?: string;
    noNegative?: boolean;
}

export interface TimeBasedRewardOptions {
    range?: number[];
    timeout?: number;
}

export interface CustomRewardOptions {
    range?: number[];
    timeout?: number;
    prefix?: string;
}

export class EconomyManager {
    noNegative?: boolean;
    prefix?: string;
    adapter: Adapters;
    db: any;

    constructor(options: Options);

    private __makeAdapter(): void;
    private _get(key: string): Promise<object>;
    private _set(key: string): Promise<boolean>;

    public addMoney(userID: string, guildID: string | false, money: number): Promise<number>;
    public subtractMoney(userID: string, guildID: string | false, money: number): Promise<number>;
    public setMoney(userID: string, guildID: string | false, money: number): Promise<number>;
    public delete(userID: string, guildID: string | false): Promise<boolean | undefined>;
    public deleteAllFromGuild(guildID: string): Promise<boolean | undefined>;
    public deleteAllFromUser(userID: string): Promise<boolean | undefined>;
    public leaderboard(guildID: string | false, limit: number): Promise<object[]>
    public all(limit: number): Promise<object[]>
    public daily(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public weekly(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public monthly(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public work(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public search(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public custom(userID: string, guildID: string | false, amount: number, ops: CustomRewardOptions): Promise<object>
    public beg(userID: string, guildID: string | false, amount: number, ops: TimeBasedRewardOptions): Promise<object>
    public fetchMoney(userID: string, guildID: string | false): Promise<number>;
    public reset(): Promise<boolean>;
    public __checkManager(): void;
}

export class Util {
    static ms(ms: number): object;
    static getCooldown(cooldownTime: number, collectedTime: number): object;
    static onCooldown(cooldownTime: number, collectedTime: number): boolean;
    static parseKey(key: string): object;
    static makeKey(user: string, guild: string | false, prefix: string): string;
    static random(from: number, to: number): number;
    static get COOLDOWN(): object;
    static get MYSQL_OPTIONS (): MySQLOptions;
    static get MONGO_OPTIONS (): MongoOptions;
    static get SQLITE_OPTIONS (): SQLiteOptions;
}

export const version: string;