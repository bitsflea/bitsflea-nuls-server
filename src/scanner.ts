import { NULSAPI } from "nuls-api-v2"
import { AsyncDataQueue } from "./queue.js"
import { processEvent } from "./events.js"
import { DataSource } from "typeorm"

import config from "./config.js"

const { POLL_INTERVAL } = config

export class Scanner {
    db: DataSource

    client: NULSAPI

    currentHeight: number

    listenContracts: Array<string>

    maxRequest: number

    queue: AsyncDataQueue

    isRun: boolean

    constructor(currentHeight: number, nulsConfg: any, contracts: Array<string>, db: DataSource) {
        this.db = db
        this.currentHeight = currentHeight
        this.maxRequest = 50
        this.client = new NULSAPI(nulsConfg)
        this.listenContracts = contracts
        this.queue = new AsyncDataQueue()
        this.isRun = false
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
        const transactions = block.txs.filter((tx: any) => tx.type === 16); // 16: 合约交易类型
        return transactions;
    }

    // 解析合约事件日志
    async parseContractEventLogs(txHashs: string | Array<string>) {
        let txHs = Array.isArray(txHashs) ? txHashs : [txHashs];
        // console.log("txHs:", txHs);
        const result = await this.client.getContractTxResultList(txHs);
        // console.log("result:", result);
        let events = [];
        for (let hs of txHs) {
            // console.log("hs:", hs);
            let data = result[hs];
            // console.log("data:", data);
            if (data && data.success && data.events && this.listenContracts.includes(data.contractAddress)) {
                events = events.concat(data.events.map((event: string) => JSON.parse(event)));
            }
        }
        return events;
    }

    // 监听区块和事件
    async pollBlocks() {
        while (this.isRun) {
            try {
                // const latestHeight = await getLatestBlockHeight();
                const latestHeight = 11586150;

                // 如果区块高度未变化，不执行操作
                if (this.currentHeight >= latestHeight) {
                    await this.sleep(POLL_INTERVAL);
                    continue;
                }

                let txHashs = [];
                // 处理新产生的区块
                for (let height = this.currentHeight + 1; height <= latestHeight; height++) {
                    console.log(`Processing block ${height}... ${txHashs.length}`);
                    const transactions = await this.getContractTransactions(height);
                    txHashs = txHashs.concat(transactions.map((tx: any) => tx.hash));
                    if (height == latestHeight || txHashs.length >= this.maxRequest) {
                        const events = await this.parseContractEventLogs(txHashs);
                        if (events.length > 0) {
                            events.forEach(async (event) => {
                                // console.debug("event: ", event);
                                await this.queue.enqueue(event)
                            });
                        }
                        txHashs = [];
                    }
                    if (!this.isRun) {
                        this.currentHeight = height;
                        break;
                    }
                    await this.sleep(0.5);
                }

                // 更新当前高度
                this.currentHeight = latestHeight;
            } catch (error) {
                console.error('Error polling blocks:', error);
            }
            await this.sleep(POLL_INTERVAL);
        }
        console.log("listener stopped.");
    }

    /**
     * 处理事件队列
     */
    async startProcEvent() {
        while (this.isRun) {
            try {
                let event = await this.queue.dequeue();
                // console.log("event:", event);
                processEvent(event, this.db, this.client);
            } catch (error) {
                console.error("Error process event: ", error)
            }
        }
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

    stop() {
        this.isRun = false
    }
}