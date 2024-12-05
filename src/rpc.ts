import { DataSource } from "typeorm"
import { User } from "./entity/user"
import { Product } from "./entity/product";
import { Order } from "./entity/order";
import { Arbitration } from "./entity/arbitration";

export class NulsRPC {
    db: DataSource

    constructor(db: DataSource) {
        this.db = db
    }

    public async getProducts(args: any) {
        let [page, pageSize, category, uid] = args
        if (page < 1) page = 1
        let query = Product.createQueryBuilder("products").where("products.status = 100")
        if (category) {
            query = query.andWhere("products.category = :category", { category })
        }
        if (uid) {
            query = query.andWhere("products.uid = :uid", { uid })
        }
        return await query.orderBy("products.publishTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
    }

    public async getOrders(args: any) {
        let [uid, page, pageSize, status] = args
        if (page < 1) page = 1
        let query = Order.createQueryBuilder("orders").where("orders.uid = :uid", { uid })
        if (status) {
            query = query.andWhere("orders.status = :status", { status })
        }
        return await query.orderBy("orders.createTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
    }

    public async getUsers(args: any) {
        let [page, pageSize, uid, isReviewer, nickname] = args
        if (page < 1) page = 1
        let query = User.createQueryBuilder("users").where("users.status = 0")
        if (uid) {
            query = query.andWhere("users.uid = :uid", { uid })
        }
        if (isReviewer) {
            query = query.andWhere("users.isReviewer = :isReviewer", { isReviewer })
        }
        if (nickname) {
            query = query.andWhere("users.nickname LIKE :nickname", { nickname: `%${nickname}%` })
        }
        return await query.orderBy("users.lastActiveTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
    }

    public async getArbitrations(args: any) {
        let [uid, page, pageSize, type, status] = args
        if (page < 1) page = 1
        let query = Arbitration.createQueryBuilder("arbits").where("arbits.plaintiff = :uid OR arbits.defendant = :uid", { uid })
        if (type) {
            query = query.andWhere("arbits.type = :type", { type })
        }
        if (status) {
            query = query.andWhere("arbits.status = :status", { status })
        }
        return await query.orderBy("arbits.createTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
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