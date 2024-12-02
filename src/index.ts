
import { AppDataSource } from "./data-source.js"
import jayson from "jayson/promise/index.js"
import { NulsRPC } from "./rpc.js"
import { Scanner } from "./scanner.js"
import config from "./config.js"

const { API_URL, CONTRACT_BITSFLEA } = config


AppDataSource.initialize()
    .then(async () => {
        const scanner = new Scanner(11586142, {
            rpcURL: API_URL,
            isBeta: true
        }, [CONTRACT_BITSFLEA], AppDataSource)

        scanner.startListener();

        const nuls = new NulsRPC(AppDataSource)
        // create a server
        const server = new jayson.Server(nuls.getMethods());

        server.http().listen(3000);
    })
    .catch((error) => console.log("Error: ", error))