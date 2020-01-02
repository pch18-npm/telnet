/// <reference types="node" />
import net = require('net');
declare class TelnetSocket {
    netSocket: net.Socket;
    constructor(netSocket: TelnetSocket['netSocket']);
    close(): void;
    wait(ms: number): Promise<void>;
    writeBuffer(data: Buffer): Promise<void>;
    writeString(data: string, lineFeed?: boolean): Promise<void>;
    readBuffer(overtime?: number): Promise<Buffer>;
    readString(overtime?: number): Promise<string>;
    readStringMatch(regExp: RegExp, overtime?: number): Promise<RegExpMatchArray>;
    readBufferUntil(find_str: string, overtime?: number): Promise<Buffer>;
    readStringUntil(find_str: string, overtime?: number): Promise<string>;
}
export declare class TelnetServer {
    private netServer;
    private config;
    constructor(port: number, config: Partial<TelnetServer['config']>, callback: (telnetSocket: TelnetSocket, netSocket: net.Socket) => Promise<void>);
    showLog(): void;
}
export {};
