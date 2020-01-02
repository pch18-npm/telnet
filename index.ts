import net = require('net');
class TelnetSocket {
    netSocket: net.Socket
    constructor(netSocket: TelnetSocket['netSocket']) {
        this.netSocket = netSocket
    }

    close() {
        this.netSocket.end()
        this.netSocket.removeAllListeners()
    }
    wait(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms))
    }

    writeBuffer(data: Buffer) {
        return new Promise<void>((resolve, reject) => {
            const resolve_callback = (err?: Error) => {
                this.netSocket.removeListener('error', reject)
                err ? reject(err) : resolve()
            }
            this.netSocket.once('error', reject)
            this.netSocket.write(data, resolve_callback)
        })
    }
    async writeString(data: string, lineFeed = true) {
        return await this.writeBuffer(Buffer.from(lineFeed ? data + '\r\n' : data))
    }

    readBuffer(overtime = 10000) {
        return new Promise<Buffer>((resolve, reject) => {
            const overtime_timer = setTimeout(() => {
                this.netSocket.removeListener('error', reject)
                this.netSocket.removeListener('data', reject)
                reject(new Error('等待流信息超时'))
            }, overtime)
            const resolve_callback = (data: Buffer) => {
                this.netSocket.removeListener('error', reject)
                clearTimeout(overtime_timer)
                resolve(data)
            }
            const reject_callback = (reason?: any) => {
                this.netSocket.removeListener('data', reject)
                clearTimeout(overtime_timer)
                reject(reason)
            }
            this.netSocket.once('error', reject_callback)
            this.netSocket.once('data', resolve_callback)
        })
    }
    async readString(overtime?: number) {
        return (await this.readBuffer(overtime)).toString()
    }
    async readStringMatch(regExp: RegExp, overtime?: number) {
        const str = await this.readString(overtime)
        const match = str.match(regExp)
        if (match) {
            return match
        } else {
            throw new Error(`使用 /${regExp.source}/${regExp.flags} 匹配文本失败: ${str}`)
        }
    }
    async readBufferUntil(find_str: string, overtime?: number) {
        const find_buf = Buffer.from(find_str)
        let new_buf = await this.readBuffer(overtime)
        let all_buf = new_buf
        while (!all_buf.includes(find_buf, find_buf.length * -2)) {
            new_buf = await this.readBuffer(overtime)
            all_buf = Buffer.concat([all_buf, new_buf]);
        }
        return all_buf
    }
    async readStringUntil(find_str: string, overtime?: number) {
        const read_buf = await this.readBufferUntil(find_str, overtime)
        return read_buf.toString()
    }

}


export class TelnetServer {
    private netServer: net.Server
    private config = {
        showLog: false
    }
    constructor(port: number, config: Partial<TelnetServer['config']>, callback: (telnetSocket: TelnetSocket, netSocket: net.Socket) => Promise<void>) {
        Object.assign(this.config, config)
        this.netServer = net.createServer((netSocket: net.Socket) => {
            this.config.showLog && console.log(`收到新的连接 ${netSocket.remoteAddress}:${netSocket.remotePort}`)
            netSocket.on('error', () => {
                telnetSocket.close()
            })
            if (this.config.showLog) {
                netSocket.on('data', (data) => {
                    console.log(`收到来自服务器消息 ${netSocket.remoteAddress}:${netSocket.remotePort}\n`, data.toString())
                })
            }
            const telnetSocket = new TelnetSocket(netSocket)
            callback(telnetSocket, netSocket).then(() => {
                telnetSocket.close()
                this.config.showLog && console.log(`回调跑完关闭端口 ${netSocket.remoteAddress}:${netSocket.remotePort}`)
            }).catch((e) => {
                telnetSocket.close()
                this.config.showLog && console.error(`回调中途出错 ${netSocket.remoteAddress}:${netSocket.remotePort}\n`, e)
            })

        })
        this.netServer.on('error', (e) => {
            e.message = `侦听${port}端口失败: ` + e.message
            throw e
        })
        this.netServer.listen(port, () => {
            console.info(`侦听${port}端口成功, 开始运行服务`)
        })
    }
    showLog() {
        this.config.showLog = true
    }

}

// export const telnetServer = (port: number, callback: (client: telnetSocket) => Promise<void>) => {

// }