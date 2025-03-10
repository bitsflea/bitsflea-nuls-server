import * as dotenv from 'dotenv';

dotenv.config();

export default {
    debug: true,
    // 轮询间隔（秒）
    POLL_INTERVAL: 5,
    API_URL: "http://beta.api.nuls.io/jsonrpc",

    // 数据库
    db_host: "localhost",
    db_port: 3306,
    db_name: "bitsflea",
    db_username: "root",
    db_password: process.env.DB_PASSWORD,

    // 开始扫描的块号
    start_block: 12324470,
    // 配置合约名映射
    contracts: {
        "Bitsflea": "tNULSeBaMzYcrWNadQdCunL8JLhKXrvVzDGrFE",
    },
    WNULS: "tNULSeBaMx9aG8vD8rsDorNtGKB4Mc9wpKs127", // NULSd6Hgmqgq924JD5aukswyrqrg6xjpTzH5w
}