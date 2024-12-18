import "./console"
import { AppDataSource } from "./data-source"
import jayson from "jayson/promise/index.js"
import { NulsRPC } from "./rpc"
import { Scanner } from "./scanner"
import config from "./config"
import { Storage } from "nuls-api-v2"

const localStorage: Storage = new Storage();

const { API_URL, start_block } = config

const CACHE_KEY_CURRENTHEIGHT = "cache_key_currentHeight"

let server: jayson.Server
let scanner: Scanner
let currentHeight = start_block

process.on('SIGINT', async function () {
    console.info("\nService is stopping...");
    if (scanner) {
        await scanner.stop()
        localStorage.setItem(CACHE_KEY_CURRENTHEIGHT, scanner.currentHeight)
        server.http().close()
        scanner = null
    }
    process.exit(0)
});

async function main() {
    await localStorage.init();
    await AppDataSource.initialize();

    let cache = localStorage.getItem(CACHE_KEY_CURRENTHEIGHT)
    // console.info("cache:", cache)
    if (cache) {
        currentHeight = cache
    }

    console.info("currentHeight:", currentHeight)

    scanner = new Scanner(currentHeight, {
        rpcURL: API_URL,
        isBeta: true
    }, AppDataSource)

    scanner.startListener();

    const nuls = new NulsRPC(AppDataSource)
    // create a server
    server = new jayson.Server(nuls.getMethods());

    server.http().listen(3000);
}

main().catch((error) => console.log("Error: ", error))