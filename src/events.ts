import { DataSource } from "typeorm"
import { NULSAPI } from "nuls-api-v2"
import { User } from "./entity/user.js"

import config from "./config.js"

const { CONTRACT_BITSFLEA } = config


const events = {
    "RegUserEvent": async (args: any, blockNumber: number, db: DataSource, api: NULSAPI) => {
        let { uid, nickname, encryptKey } = args;
        let user = await User.findOneBy({ uid })
        if (user == null) {
            user = new User()
        }
        let u = await api.invokeView(CONTRACT_BITSFLEA, "getUser", null, [uid])
        u = JSON.parse(u.result)
        user.status = u.status
        user.isReviewer = u.isReviewer
        user.nickname = u.nickname
        user.head = u.head
        user.phoneHash = u.phoneHash
        user.phoneEncrypt = u.phoneEncrypt
        user.referrer = u.referrer
        user.creditValue = u.creditValue
        user.lastActiveTime = u.lastActiveTime
        user.postsTotal = u.postsTotal
        user.sellTotal = u.sellTotal
        user.buyTotal = u.buyTotal
        user.referralTotal = u.referralTotal
        user.encryptKey = u.encryptKey
        user.save()
    },
};


export function processEvent(data: any, db: DataSource, api: NULSAPI) {
    let fun = events[data.event];
    if (fun && typeof fun === "function") {
        fun(data.payload, data.blockNumber, db, api);
    }
}
