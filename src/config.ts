import * as dotenv from 'dotenv';

dotenv.config();

export default {
    // 轮询间隔（秒）
    POLL_INTERVAL: 5,
    API_URL: "http://beta.api.nuls.io/jsonrpc",
    CONTRACT_BITSFLEA: "tNULSeBaN5kC41vEf1VEcpCCguJp4FyMgk9xzs",

    db_host: "localhost",
    db_port: 3306,
    db_username: "root",
    db_password: process.env.DB_PASSWORD,

}