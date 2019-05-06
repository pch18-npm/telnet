"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class TelnetSocket {
    constructor(netSocket) {
        this.netSocket = netSocket;
    }
    close() {
        this.netSocket.end();
        this.netSocket.removeAllListeners();
    }
    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    writeBuffer(data) {
        return new Promise((resolve, reject) => {
            const resolve_callback = (err) => {
                this.netSocket.removeListener('error', reject);
                err ? reject(err) : resolve();
            };
            this.netSocket.once('error', reject);
            this.netSocket.write(data, resolve_callback);
        });
    }
    readBuffer() {
        return new Promise((resolve, reject) => {
            const resolve_callback = (data) => {
                this.netSocket.removeListener('error', reject);
                resolve(data);
            };
            this.netSocket.once('error', reject);
            this.netSocket.once('data', resolve_callback);
        });
    }
    writeString(data, lineFeed = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.writeBuffer(Buffer.from(lineFeed ? data + '\r\n' : data));
        });
    }
    readString() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.readBuffer()).toString();
        });
    }
    readStringMatch(...avgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const regExp = avgs[0];
            const getIndex = avgs[1];
            const str = yield this.readString();
            const match = str.match(regExp);
            if (match) {
                if (getIndex) {
                    return match[getIndex];
                }
                else {
                    return match;
                }
            }
            else {
                throw new Error(`使用 /${regExp.source}/${regExp.flags} 匹配文本失败: ${str}`);
            }
        });
    }
    readUntil(find_str) {
        return __awaiter(this, void 0, void 0, function* () {
            const find_bf = Buffer.from(find_str);
            let new_bf = yield this.readBuffer();
            let all_bf = new_bf;
            while (!all_bf.includes(find_bf, find_bf.length * -2)) {
                new_bf = yield this.readBuffer();
                all_bf = Buffer.concat([all_bf, new_bf]);
            }
            return all_bf;
        });
    }
}
class TelnetServer {
    constructor(port, callback) {
        this.config = {
            showLog: false
        };
        this.netServer = net.createServer((netSocket) => {
            this.config.showLog && console.log(`收到新的连接 ${netSocket.remoteAddress}:${netSocket.remotePort}`);
            netSocket.on('error', () => {
                telnetSocket.close();
            });
            if (this.config.showLog) {
                netSocket.on('data', (data) => {
                    console.log(`收到来自服务器消息 ${netSocket.remoteAddress}:${netSocket.remotePort}\n`, data.toString());
                });
            }
            const telnetSocket = new TelnetSocket(netSocket);
            callback(telnetSocket, netSocket).then(() => {
                telnetSocket.close();
                this.config.showLog && console.log(`回调跑完关闭端口 ${netSocket.remoteAddress}:${netSocket.remotePort}`);
            }).catch((e) => {
                telnetSocket.close();
                this.config.showLog && console.error(`回调中途出错 ${netSocket.remoteAddress}:${netSocket.remotePort}\n`, e);
            });
        });
        this.netServer.on('error', (e) => {
            e.message = `侦听${port}端口失败: ` + e.message;
            throw e;
        });
        this.netServer.listen(port, () => {
            console.info(`侦听${port}端口成功, 开始运行服务`);
        });
    }
    showLog() {
        this.config.showLog = true;
    }
}
exports.TelnetServer = TelnetServer;
// export const telnetServer = (port: number, callback: (client: telnetSocket) => Promise<void>) => {
// }
