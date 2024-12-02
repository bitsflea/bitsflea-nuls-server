export class AsyncDataQueue {
    /**
     * 存储数据的队列
     */
    queue: any[] = [];
    /**
     * 等待获取数据的解析器
     */
    pendingResolvers: any[] = [];


    /**
     * 向队列中添加数据
     * @param {*} data - 任意数据
     */
    async enqueue(data: any) {
        if (this.pendingResolvers.length > 0) {
            // 如果有等待获取数据的 resolver，直接调用它
            const resolver = this.pendingResolvers.shift();
            resolver(data);
        } else {
            // 否则将数据添加到队列中
            this.queue.push(data);
        }
    }

    /**
     * 从队列中获取数据（异步等待）
     * @returns {Promise<*>} - 返回队列中的数据
     */
    async dequeue() {
        if (this.queue.length > 0) {
            // 如果队列中有数据，直接返回
            return this.queue.shift();
        }

        // 如果队列为空，返回一个 Promise，并将其 resolver 存储起来
        return new Promise((resolve) => {
            this.pendingResolvers.push(resolve);
        });
    }
}