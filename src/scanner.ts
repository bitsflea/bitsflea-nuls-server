import { NULSAPI } from "nuls-api-v2"
import { AsyncDataQueue } from "./queue"
import { processEvent } from "./events"
import { DataSource } from "typeorm"

import config from "./config"

const { POLL_INTERVAL } = config

export class Scanner {
    db: DataSource

    client: NULSAPI

    currentHeight: number

    listenContracts: Array<string>

    maxRequest: number

    queue: AsyncDataQueue

    isRun: boolean
    runCount: number
    initHandel: Function

    constructor(currentHeight: number, nulsConfg: any, contracts: Array<string>, db: DataSource) {
        this.db = db
        this.currentHeight = typeof currentHeight !== "number" ? parseInt(currentHeight) : currentHeight;
        this.maxRequest = 50
        this.client = new NULSAPI(nulsConfg)
        this.listenContracts = contracts
        this.queue = new AsyncDataQueue()
        this.isRun = false
        this.runCount = 0
    }

    addContract(contract: string) {
        this.listenContracts.push(contract)
        this.listenContracts = [...new Set(this.listenContracts)]
    }

    async initDBContracts() {
        if (this.initHandel) {
            let cs = await this.initHandel()
            if (cs && cs.length > 0)
                this.listenContracts = this.listenContracts.concat(cs)
        }
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

    async getContractTransactions(blockHeight: number) {
        const block = await this.client.getBlockByHeight(blockHeight);
        // console.log("block", block);
        const transactions = block.txs.filter((tx: any) => tx.type === 16 && tx.status === 1); // 16: 合约交易类型
        // console.log("transactions:", transactions);
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
            if (data && data.success && data.events && this.listenContracts.includes(data.contractAddress)) {
                events = events.concat(data.events.map((event: string) => {
                    let tx = txs.find((t) => t.hash = hs)
                    return Object.assign(JSON.parse(event), { ...tx })
                }));
            }
        }
        return events;
    }

    // 监听区块和事件
    async pollBlocks() {
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
                for (let height = this.currentHeight + 1; height <= latestHeight; height++) {
                    console.debug(`Processing block: ${height}... Unprocessed tx count: ${txs.length}`);
                    const transactions = await this.getContractTransactions(height);
                    // console.log(transactions)
                    txs = txs.concat(transactions.map((tx: any) => ({ hash: tx.hash, timestamp: tx.timestamp, inBlockIndex: tx.inBlockIndex })));
                    unprocessedBlocks += 1;
                    // console.log("txHashs:", txHashs);
                    if (height == latestHeight || txs.length >= this.maxRequest || (unprocessedBlocks >= 10 && txs.length > 0) || (!this.isRun && txs.length > 0)) {
                        const events = await this.parseContractEventLogs(txs);
                        // console.log("events:", events)
                        if (events.length > 0) {
                            events.sort((a, b) => {
                                if (a.blockNumber !== b.blockNumber) {
                                    return a.blockNumber - b.blockNumber;
                                }
                                return a.inBlockIndex - b.inBlockIndex;
                            })
                            events.forEach(async (event) => {
                                // console.debug("event: ", event);
                                await this.queue.enqueue(event)
                            });
                        }
                        txs = [];
                        unprocessedBlocks = 0;
                    }

                    if (!this.isRun) {
                        this.currentHeight = height;
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
            console.log("this.currentHeight:", this.currentHeight)
            await this.sleep(POLL_INTERVAL);
        }
        this.runCount -= 1
        this.queue.close()
        console.info("listener stopped.");
    }

    /**
     * 处理事件队列
     */
    async startProcEvent() {
        this.runCount += 1
        while (this.isRun) {
            try {
                let event = await this.queue.dequeue();
                if (event)
                    processEvent(event, this);
            } catch (error) {
                console.error("Error process event: ", error)
            }
        }
        this.runCount -= 1
    }

    // 启动监听服务
    startListener() {
        // 初始化当前高度
        // currentHeight = await getLatestBlockHeight();
        console.log(`Starting listener from block ${this.currentHeight}...`);

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