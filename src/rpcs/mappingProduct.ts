import { SelectQueryBuilder } from "typeorm"
import { Arbitration } from "../entity/arbitration"
import { Order } from "../entity/order"
import { Product } from "../entity/product"
import { User } from "../entity/user"
import { Reviewer } from "../entity/reviewer"

export async function handleGetProducts(args: any) {
    // console.log("handleGetProducts args:", args)
    let [page, pageSize, category, uid, status] = args
    page -= 1
    if (page < 0) page = 0
    if (status == null) status = 100
    let query: any
    if (status == -1) {
        query = Product.createQueryBuilder("products").where("products.status <= 400")
    } else {
        query = Product.createQueryBuilder("products").where("products.status = :status", { status })
    }
    if (category) {
        query = query.andWhere("products.category = :category", { category })
    }
    if (uid) {
        query = query.andWhere("products.uid = :uid", { uid })
    }
    // console.log("query:", query.orderBy("products.publishTime", "DESC").skip(page * pageSize).take(pageSize).getSql())
    return await query.orderBy("products.publishTime", "DESC").skip(page * pageSize).take(pageSize).getMany()
}

export async function handleGetProductsByIds(args: any) {
    let [ids] = args
    let query = Product.createQueryBuilder("products").where("products.pid IN (:...ids)", { ids })
    return await query.orderBy("products.publishTime", "DESC").getMany()
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

export async function handleGetReviewer(args: any) {
    let [name, address, page, pageSize] = args
    page -= 1
    if (page < 0) page = 0
    let query = Reviewer.createQueryBuilder("reviewer").leftJoin('user', 'user', 'user.uid = reviewer.uid')
    query = query.select(['reviewer.uid', 'reviewer.createTime', 'reviewer.lastActiveTime', 'reviewer.approveCount', 'reviewer.againstCount',
        'reviewer.voted', 'user.nickname', 'user.head', 'user.creditValue', 'user.isReviewer', 'user.extendInfo'
    ])
    if (name) {
        query = query.where("user.nickname LIKE :nickname", { nickname: `%${name}%` })
    } else if (address) {
        query = query.where("reviewer.uid LIKE :uid", { uid: `%${address}%` })
    } else {
        query = query.where("reviewer.uid IS NOT NULL")
    }
    query = query.orderBy('reviewer.createTime', "DESC").skip(page * pageSize).take(pageSize)
    return (await query.getRawMany()).map(item => ({
        againstCount: item.reviewer_againstCount,
        approveCount: item.reviewer_approveCount,
        createTime: item.reviewer_createTime,
        lastActiveTime: item.reviewer_lastActiveTime,
        uid: item.reviewer_uid,
        voted: item.reviewer_voted,
        creditValue: item.user_creditValue,
        extendInfo: item.user_extendInfo,
        head: item.user_head,
        isReviewer: item.user_isReviewer,
        nickname: item.user_nickname
    }))
}