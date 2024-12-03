
import { AppDataSource } from "./data-source"
import jayson from "jayson/promise/index.js"
import { NulsRPC } from "./rpc"
import { Scanner } from "./scanner"
import config from "./config"
import { LocalStorage } from 'node-localstorage';

const localStorage = new LocalStorage('./cache');

const { API_URL, CONTRACT_BITSFLEA } = config

const CACHE_KEY_CURRENTHEIGHT = "cache_key_currentHeight"

let server: jayson.Server
let scanner: Scanner
let currentHeight = 11586142

let cache = localStorage.getItem(CACHE_KEY_CURRENTHEIGHT)
// console.log("cache:", cache)
if (cache) {
    currentHeight = cache
}

console.log("currentHeight:", currentHeight)

process.on('SIGINT', async function () {
    console.log("\nService is stopping...");
    if (scanner) {
        await scanner.stop()
        localStorage.setItem(CACHE_KEY_CURRENTHEIGHT, scanner.currentHeight)
        server.http().close()
        scanner = null
    }
    process.exit(0)
});

AppDataSource.initialize()
    .then(async () => {
        scanner = new Scanner(currentHeight, {
            rpcURL: API_URL,
            isBeta: true
        }, [CONTRACT_BITSFLEA], AppDataSource)

        scanner.startListener();

        const nuls = new NulsRPC(AppDataSource)
        // create a server
        server = new jayson.Server(nuls.getMethods());

        server.http().listen(3000);
    })
    .catch((error) => console.log("Error: ", error))