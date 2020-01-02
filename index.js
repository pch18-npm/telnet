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
    readBuffer(overtime = 10000) {
        return new Promise((resolve, reject) => {
            const overtime_timer = setTimeout(() => {
                this.netSocket.removeListener('error', reject);
                this.netSocket.removeListener('data', reject);
                reject(new Error('等待流信息超时'));
            }, overtime);
            const resolve_callback = (data) => {
                this.netSocket.removeListener('error', reject);
                clearTimeout(overtime_timer);
                resolve(data);
            };
            const reject_callback = (reason) => {
                this.netSocket.removeListener('data', reject);
                clearTimeout(overtime_timer);
                reject(reason);
            };
            this.netSocket.once('error', reject_callback);
            this.netSocket.once('data', resolve_callback);
        });
    }
    writeString(data, lineFeed = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.writeBuffer(Buffer.from(lineFeed ? data + '\r\n' : data));
        });
    }
    readString(overtime) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.readBuffer(overtime)).toString();
        });
    }
    readStringMatch(regExp, getIndex, overtime) {
        return __awaiter(this, void 0, void 0, function* () {
            const str = yield this.readString(overtime);
            const match = str.match(regExp);
            if (match) {
                return match;
            }
            else {
                throw new Error(`使用 /${regExp.source}/${regExp.flags} 匹配文本失败: ${str}`);
            }
        });
    }
    readBufferUntil(find_str) {
        return __awaiter(this, void 0, void 0, function* () {
            const find_buf = Buffer.from(find_str);
            let new_buf = yield this.readBuffer();
            let all_buf = new_buf;
            while (!all_buf.includes(find_buf, find_buf.length * -2)) {
                new_buf = yield this.readBuffer();
                all_buf = Buffer.concat([all_buf, new_buf]);
            }
            return all_buf;
        });
    }
    readStringUntil(find_str) {
        return __awaiter(this, void 0, void 0, function* () {
            const read_buf = yield this.readBufferUntil(find_str);
            return read_buf.toString();
        });
    }
}
class TelnetServer {
    constructor(port, config, callback) {
        this.config = {
            showLog: false
        };
        Object.assign(this.config, config);
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
