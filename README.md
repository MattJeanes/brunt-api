# DEPRECATED: I no longer use the Brunt Blind Engine, recommend using the [Home Assistant integration](https://www.home-assistant.io/integrations/brunt/) instead

# brunt-api

An unofficial api for Brunt (Blind Engine, etc)

## Install

`yarn add brunt-api` or `npm install brunt-api`

## Usage

This is an example class you can use to open/close your Brunt Blind Engine devices by name

```typescript
class Blinds {
    private api = new BruntAPI(config.env === config.envs.local);
    constructor() {
        this.testConnection();
    }
    public async testConnection() {
        const resp = await this.api.login(config.blinds.username, config.blinds.password);
        logger.info(`Authenticated with Brunt API as ${resp.nickname}`);
    }
    public async open(name: string) {
        const sessionId = await this.getSessionId();
        const thingUri = await this.getThingUri(sessionId, name);
        await this.api.changePosition(sessionId, thingUri, 100);
    }
    public async close(name: string) {
        const sessionId = await this.getSessionId();
        const thingUri = await this.getThingUri(sessionId, name);
        await this.api.changePosition(sessionId, thingUri, 0);
    }
    private async getSessionId() {
        const resp = await this.api.login(config.blinds.username, config.blinds.password);
        return resp.sessionId;
    }
    private async getThingUri(sessionId: string, name: string) {
        const resp = await this.api.getThings(sessionId);
        const thing = resp.find(x => x.NAME === name);
        if (!thing) {
            throw new Error(`Thing ${name} not found`);
        }
        return thing.thingUri;
    }
}
```

## API

```typescript
export interface IBruntLoginResponse {
    latestLogin: number;
    primaryId: string;
    ROLE: string;
    nickname: string;
    createdTime: number;
    company: string;
    newEmail: string;
    ID: string;
    lang: string;
    status: string;
    bruntLoginTime: string;
    sessionId: string;
}
export interface IBruntThing {
    TIMESTAMP: string;
    NAME: string;
    SERIAL: string;
    MODEL: string;
    requestPosition: string;
    currentPosition: string;
    moveState: string;
    setLoad: string;
    currentLoad: string;
    FW_VERSION: string;
    overStatus: string;
    ICON: string;
    thingUri: string;
    PERMISSION_TYPE: string;
    delay: number;
}
export interface IBruntStateResponse {
    TIMESTAMP: string;
    NAME: string;
    SERIAL: string;
    MODEL: string;
    requestPosition: string;
    currentPosition: string;
    moveState: string;
    setLoad: string;
    currentLoad: string;
    FW_VERSION: string;
    overStatus: string;
    ICON: string;
    delay: number;
}
export declare class BruntAPI {
    private http;
    constructor(debug: boolean);
    login(username: string, password: string): Promise<IBruntLoginResponse>;
    getThings(sessionId: string): Promise<IBruntThing[]>;
    getState(sessionId: string, thingUri: string): Promise<IBruntStateResponse>;
    changePosition(sessionId: string, thingUri: string, position: number): Promise<boolean>;
}
```
