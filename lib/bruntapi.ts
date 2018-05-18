import * as cookie from "cookie";
import * as https from "https";

interface IBruntHttpRequest {
    method?: string;
    data?: any;
    sessionId?: string;
    host?: string;
    port?: number | string;
    path?: string;
    headers?: any;
}

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

class BruntHttp {
    /**
     *
     * @param debug set to true to log http response and errors to the console
     */
    constructor(private debug: boolean) { }

    public POST<T>(data: IBruntHttpRequest) {
        data.method = "POST";
        return this._http<T>(data);
    }

    public PUT<T>(data: IBruntHttpRequest) {
        data.method = "PUT";
        return this._http<T>(data);
    }

    public GET<T>(data: IBruntHttpRequest) {
        data.method = "GET";
        return this._http<T>(data);
    }

    public DELETE<T>(data: IBruntHttpRequest) {
        data.method = "DELETE";
        return this._http<T>(data);
    }

    public OPTIONS<T>(data: IBruntHttpRequest) {
        data.method = "OPTIONS";
        return this._http<T>(data);
    }

    private _http<T>(data: any) {
        return new Promise<T>((resolve, reject) => {
            //console.log("Timeout setting: ",waitTime/1000,"s");
            let options: https.RequestOptions;
            options = {
                hostname: data.host,
                port: data.port,
                path: data.path,
                method: data.method,
                headers: {},
            };
            options.headers = {};

            //console.log(options.path);
            if (data.data) {
                data.data = JSON.stringify(data.data);
                options.headers["Content-Length"] = Buffer.byteLength(data.data);
                options.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
                options.headers.Origin = "https://sky.brunt.co";
                options.headers["Accept-Language"] = "en-gb";
                options.headers.Accept = "application/vnd.brunt.v1+json";
                options.headers["User-Agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E216";
            }

            if (data.sessionId) {
                options.headers.Cookie = "skySSEIONID=" + data.sessionId;
            }

            if (this.debug) { console.log("[Brunt API Debug] HTTP Request:\n", options); }

            let resp: any = "";

            const req = https.request(options, (response) => {

                response.on("data", (chunk: string) => {
                    resp += chunk;
                });

                response.on("end", () => {
                    if (this.debug) { console.log("[Brunt API Debug] Response in http:\n", resp); }
                    try {

                        if (response.statusCode === 200 && resp.length > 1) {
                            resp = JSON.parse(resp);

                            const setcookie = response.headers["set-cookie"];
                            if (setcookie !== undefined) {
                                const cookies = cookie.parse(setcookie[0]);
                                resp.sessionId = cookies.skySSEIONID;
                                if (this.debug) { console.log("[Brunt API Debug] Session ID: ", cookies.skySSEIONID); }
                            }
                        } else if (response.statusCode === 200) {
                            // Empty 200 response
                            resp = true;
                        }
                        resolve(resp);
                    } catch (e) {
                        if (this.debug) {
                            console.log("[Brunt API Debug] e.stack:\n", e.stack);
                            console.log("[Brunt API Debug] Raw message:\n", resp);
                            console.log("[Brunt API Debug] Status Code:\n", response.statusCode);
                        }
                        reject(e);
                    }
                });
            });

            req.on("error", (e: any) => {
                if (this.debug) { console.log(`[${new Date()} Brunt API Debug] Error at req: ${e.code.trim()} - ${data.path}\n`); }
                reject(e);
            });

            // For POST (submit) state
            if (data.data) {
                req.write(data.data);
                //console.log(data.data);
            }

            req.end();
        });
    }
}

export class BruntAPI {

    private http: BruntHttp;
    constructor(debug: boolean) {
        this.http = new BruntHttp(debug);
    }

    public async login(username: string, password: string) {
        const data: IBruntHttpRequest = {
            data: {
                ID: username,
                PASS: password,
            },
            path: "/session",
            host: "sky.brunt.co",
            port: "443",
        };
        const resp = await this.http.POST<IBruntLoginResponse>(data);
        if (resp && resp.status && resp.status === "activate") {
            return resp;
        }
        throw new Error("Login failed");
    }

    public async getThings(sessionId: string) {
        const data: IBruntHttpRequest = {
            path: "/thing",
            host: "sky.brunt.co",
            port: 443,
            sessionId,
        };
        const resp = await this.http.GET<IBruntThing[]>(data);
        return resp;
    }

    public async getState(sessionId: string, thingUri: string) {
        const data: IBruntHttpRequest = {
            path: "/thing" + thingUri,
            host: "thing.brunt.co",
            port: 8080,
            sessionId,
        };
        const resp = await this.http.GET<IBruntStateResponse>(data);
        return resp;
    }

    public async changePosition(sessionId: string, thingUri: string, position: number) {
        const data: IBruntHttpRequest = {
            data: {
                requestPosition: position.toString(),
            },
            path: "/thing" + thingUri,
            host: "thing.brunt.co",
            port: 8080,
            sessionId,
        };
        const resp = await this.http.PUT<boolean>(data);
        return resp;
    }
}
