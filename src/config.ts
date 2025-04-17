import * as dotenv from 'dotenv';

dotenv.config();

export default {
    debug: true,
    // 轮询间隔（秒）
    POLL_INTERVAL: 5,
    API_URL: "https://api.nuls.io/jsonrpc",

    // 数据库
    db_host: process.env.DB_HOST ?? "localhost",
    db_port: process.env.DB_PORT ?? 3306,
    db_name: "bitsflea_main",
    db_username: process.env.DB_USERNAME ?? "root",
    db_password: process.env.DB_PASSWORD,

    // 开始扫描的块号
    start_block: 17362850,
    batch_block_size: 50,
    // 配置合约名映射
    contracts: {
        "Bitsflea": "NULSd6Hh1LacznpTiQ7K7vKbbnqARVRriZgZM",
    },
    WNULS: "NULSd6HgnjgEdarTNnBRGwhHaXU6MUXyHtLLi",
}