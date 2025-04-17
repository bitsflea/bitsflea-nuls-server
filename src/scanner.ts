import { NULSAPI, getSender } from "nuls-api-v2"
import { AsyncDataQueue } from "./queue"
import { Events } from "./event"
import { DataSource } from "typeorm"

import config from "./config"
import { IPFS } from "./ipfs"

const { POLL_INTERVAL, contracts } = config

export class Scanner {
    db: DataSource
    client: NULSAPI
    currentHeight: number
    processedBlocks: number
    listenContracts: Array<string>
    maxRequest: number
    queue: AsyncDataQueue
    isRun: boolean
    runCount: number
    events: Events
    contractMap: Record<string, string>
    // ipfs: IPFS

    constructor(currentHeight: number, nulsConfg: any, db: DataSource) {
        this.db = db
        this.currentHeight = typeof currentHeight !== "number" ? parseInt(currentHeight) : currentHeight;
        this.processedBlocks = this.currentHeight
        this.maxRequest = 50
        this.client = new NULSAPI(nulsConfg)
        this.listenContracts = Object.values(contracts)
        this.queue = new AsyncDataQueue()
        this.isRun = false
        this.runCount = 0
        this.events = new Events("./events")
        this.contractMap = contracts
        // this.ipfs = new IPFS()
    }

    addContract(contract: string, template: string) {
        this.events.addNewContract(contract, template)

        this.listenContracts.push(contract)
        this.listenContracts = [...new Set(this.listenContracts)]
    }

    async initDBContracts() {
        let funs = Object.values(this.events.templates)
        let cs = []
        for (let fun of funs) {
            let data = await fun()
            cs = cs.concat(data)
        }
        if (cs && cs.length > 0) {
            this.listenContracts = this.listenContracts.concat(cs.map((v) => v.address))
            for (let c of cs) {
                this.events.addNewContract(c.address, c.template)
            }
        }
        // await this.ipfs.init()
    }

    async sleep(interval: number) {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, interval * 1000);
        })
    }

    async getLatestBlockHeight() {
        return await this.client.getLatestHeight();
    }

    async getContractTransactions(startBlock: number, endBlock: number) {
        const blocks = await this.client.getBlocks(startBlock, endBlock);
        let transactions = []
        for (const block of blocks) {
            const txs = block.txs.filter((tx: any) => tx.type === 16 && tx.status === 1); // 16: 合约交易类型
            transactions = transactions.concat(txs)
        }
        // console.log("transactions:", JSON.stringify(transactions));
        return transactions;
    }

    // 解析合约事件日志
    async parseContractEventLogs(txs: Array<any>) {
        if (txs.length < 1) return []
        let txHs = txs.map(tx => tx.hash);
        // console.log("txHs:", txHs);
        const result = await this.client.getContractTxResultList(txHs);
        // console.log("result:", result);
        let events = [];
        for (let hs of txHs) {
            // console.log("hs:", hs);
            let data = result[hs];
            // console.log("data:", data);
            if (data && data.success && data.events) {
                events = events.concat(data.events.map((event: string) => {
                    let tx = txs.find((t) => t.hash == hs)
                    return Object.assign(JSON.parse(event), { ...tx })
                }));
                // events = events.filter(ev => this.listenContracts.includes(ev.contractAddress))  // 不能在这里过滤，因为处理不了新创建的合约
            }
        }
        return events;
    }

    // 监听区块和事件
    async pollBlocks() {
        await this.events.loadMappings()
        await this.initDBContracts()
        this.runCount += 1
        while (this.isRun) {
            try {
                const latestHeight = await this.getLatestBlockHeight();
                // const latestHeight = 11586150;

                // 如果区块高度未变化，不执行操作
                if (this.currentHeight >= latestHeight) {
                    await this.sleep(POLL_INTERVAL);
                    continue;
                }

                let txs = [];
                let unprocessedBlocks = 0;
                // 处理新产生的区块
                for (let start = this.currentHeight + 1; start <= latestHeight; start += config.batch_block_size) {
                    const end = Math.min(start + config.batch_block_size - 1, latestHeight);
                    console.info(`Processing block: [${start}-${end}]... Unprocessed tx count: ${txs.length}`);
                    const transactions = await this.getContractTransactions(start, end);
                    // console.log(transactions)
                    txs = txs.concat(transactions.map((tx: any) => ({ hash: tx.hash, timestamp: tx.timestamp, inBlockIndex: tx.inBlockIndex, from: getSender(tx.txDataHex) })));
                    unprocessedBlocks += 1;
                    // console.log("txHashs:", txHashs);
                    if (end == latestHeight || txs.length >= this.maxRequest || (unprocessedBlocks >= 10 && txs.length > 0) || (!this.isRun && txs.length > 0)) {
                        const events = await this.parseContractEventLogs(txs);
                        // console.log("events:", events)
                        if (events.length > 0) {
                            events.sort((a, b) => {
                                if (a.blockNumber !== b.blockNumber) {
                                    return a.blockNumber - b.blockNumber;
                                }
                                return a.inBlockIndex - b.inBlockIndex;
                            })
                            for (let event of events) {
                                // console.debug("event: ", event);
                                if (this.events.checkEvent(event)) {
                                    await this.queue.enqueue(event)
                                } else {
                                    console.warn("No handler found:", event.contractAddress, event.event)
                                }
                            }
                        }
                        txs = [];
                        unprocessedBlocks = 0;
                    }

                    if (!this.isRun) {
                        this.currentHeight = end;
                        break;
                    }
                    await this.sleep(0.5);
                }
                if (!this.isRun) {
                    break;
                }
                // 更新当前高度
                this.currentHeight = latestHeight;
            } catch (error) {
                console.error('Error polling blocks:', error);
            }
            console.info("currentHeight:", this.currentHeight)
            await this.sleep(POLL_INTERVAL);
        }
        this.runCount -= 1
        this.queue.close()
        console.info("Service stopped.");
    }

    /**
     * 处理事件队列
     */
    async startProcEvent() {
        this.runCount += 1
        while (this.isRun) {
            try {
                let event = await this.queue.dequeue()
                if (event) {
                    console.info(`Queue count: ${this.queue.pendingResolvers.length}/${this.queue.queue.length}`, event.contractAddress, event.event)
                    if (this.listenContracts.includes(event.contractAddress)) {
                        await this.events.processEvent(event, this)
                    } else {
                        console.warn("No contract found:", event.contractAddress, event.event)
                    }
                }
            } catch (error) {
                console.error("Error process event: ", error)
            }
            await this.sleep(0.2)
        }
        this.runCount -= 1
    }

    // 启动监听服务
    startListener() {
        // 初始化当前高度
        // currentHeight = await getLatestBlockHeight();
        console.info(`Starting listener from block ${this.currentHeight}...`);

        this.isRun = true
        this.startProcEvent()
        this.pollBlocks()
    }

    async stop() {
        this.isRun = false
        while (this.runCount > 0) {
            // console.debug("count:", this.runCount)
            await this.sleep(0.5)
        }
    }
}