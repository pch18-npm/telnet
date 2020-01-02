/// <reference types="node" />
import net = require('net');
declare class TelnetSocket {
    netSocket: net.Socket;
    constructor(netSocket: TelnetSocket['netSocket']);
    close(): void;
    wait(ms: number): Promise<void>;
    writeBuffer(data: Buffer): Promise<void>;
    readBuffer(overtime?: number): Promise<Buffer>;
    writeString(data: string, lineFeed?: boolean): Promise<void>;
    readString(overtime?: number): Promise<string>;
    readStringMatch(regExp: RegExp): Promise<RegExpMatchArray>;
    readStringMatch(regExp: RegExp, getIndex: number): Promise<string>;
    readBufferUntil(find_str: string): Promise<Buffer>;
    readStringUntil(find_str: string): Promise<string>;
}
export declare class TelnetServer {
    private netServer;
    private config;
    constructor(port: number, config: Partial<TelnetServer['config']>, callback: (telnetSocket: TelnetSocket, netSocket: net.Socket) => Promise<void>);
    showLog(): void;
}
export {};
