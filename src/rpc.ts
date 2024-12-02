import { DataSource } from "typeorm"
import { User } from "./entity/user.js"

export class NulsRPC {
    db: DataSource

    constructor(db: DataSource) {
        this.db = db
    }

    async getProducts(args: any) {
        let [page, pageSize] = args;
        console.log(page, pageSize)
        return args
    }

    async getUser(args: any) {
        const [uid] = args
        const user = await User.findOneBy({ uid })
        // console.log("user:", user)
        return user
    }

    getMethods() {
        return {
            getProducts: this.getProducts,
            getUser: this.getUser
        }
    }
}