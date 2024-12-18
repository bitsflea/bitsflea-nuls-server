import { Arbitration } from "../entity/arbitration"
import { Order } from "../entity/order"
import { Product } from "../entity/product"
import { User } from "../entity/user"

export async function handleGetProducts(args: any) {
    let [page, pageSize, category, uid] = args
    page -= 1
    if (page < 0) page = 0
    let query = Product.createQueryBuilder("products").where("products.status = 100")
    if (category) {
        query = query.andWhere("products.category = :category", { category })
    }
    if (uid) {
        query = query.andWhere("products.uid = :uid", { uid })
    }
    return await query.orderBy("products.publishTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
}

export async function handleGetOrders(args: any) {
    let [uid, page, pageSize, status] = args
    page -= 1
    if (page < 0) page = 0
    let query = Order.createQueryBuilder("orders").where("orders.uid = :uid", { uid })
    if (status) {
        query = query.andWhere("orders.status = :status", { status })
    }
    return await query.orderBy("orders.createTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
}

export async function handleGetUsers(args: any) {
    let [page, pageSize, uid, isReviewer, nickname] = args
    page -= 1
    if (page < 0) page = 0

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

export async function handleGetArbitrations(args: any) {
    let [uid, page, pageSize, type, status] = args
    page -= 1
    if (page < 0) page = 0
    let query = Arbitration.createQueryBuilder("arbits").where("arbits.plaintiff = :uid OR arbits.defendant = :uid", { uid })
    if (type) {
        query = query.andWhere("arbits.type = :type", { type })
    }
    if (status) {
        query = query.andWhere("arbits.status = :status", { status })
    }
    return await query.orderBy("arbits.createTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
}