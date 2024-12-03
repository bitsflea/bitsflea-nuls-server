import { DataSource } from "typeorm"
import { User } from "./entity/user"

export class NulsRPC {
    db: DataSource

    constructor(db: DataSource) {
        this.db = db
    }

    public async getProducts(args: any) {
        let [page, pageSize] = args;
        console.log(page, pageSize)
        return args
    }

    public async getUser(args: any) {
        const [uid] = args
        const user = await User.findOneBy({ uid })
        // console.log("user:", user)
        return user
    }

    public getMethods(): {} {
        let methods = {};
        let proto = Object.getPrototypeOf(this);

        while (proto && proto !== Object.prototype) {
            Object.getOwnPropertyNames(proto).forEach((key) => {
                if (
                    key !== "constructor" &&
                    typeof this[key] === "function" &&
                    key !== "getMethods" // 防止自身的辅助方法被加入
                ) {
                    methods[key] = this[key].bind(this);
                }
            });
            proto = Object.getPrototypeOf(proto);
        }

        return methods;
    }
}