import { NULSAPI } from "nuls-api-v2"
import { User } from "../entity/user"
import config from "../config"
import { Product } from "../entity/product"

import { multyAssetToString, getHashCode } from "../tools"
import { Reviewer } from "../entity/reviewer"
import { Order } from "../entity/order"
import { ProductReturn } from "../entity/productReturn"
import { Arbitration } from "../entity/arbitration"

const CONTRACT_BITSFLEA = config.contracts['Bitsflea']

let globalConfig = null

async function getGlobal(api: NULSAPI) {
    if (globalConfig) return globalConfig
    globalConfig = await api.invokeView(CONTRACT_BITSFLEA, "getGlobal", null, [])
    return globalConfig
}

async function updataUser(uid: string, api: NULSAPI) {
    let user = await User.findOneBy({ uid })
    if (user == null) {
        user = new User()
        user.uid = uid
    }
    let u = await api.invokeView(CONTRACT_BITSFLEA, "getUser", null, [uid])

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
    user.extendInfo = u.extendInfo
    await user.save()
}


async function subCredit(g: any, user: User, value: number) {
    user.creditValue -= value < 0 ? -value : value;
    if (user.creditValue < 0) user.creditValue = 0
    if (user.creditValue < g.creditReviewerLimit && user.isReviewer) {
        user.isReviewer = false;
    }
    if (user.creditValue <= 0) {
        user.status = 1;
    }
    await user.save()
}


async function getProductReturn(api: NULSAPI, oid: string) {
    return await api.invokeView(CONTRACT_BITSFLEA, "getProductReturn", null, [oid])
}


async function getArbitration(api: NULSAPI, aid: string) {
    return await api.invokeView(CONTRACT_BITSFLEA, "getArbit", null, [aid])
}

export async function handleRegUserEvent(event: any, scanner: any) {
    let { uid } = event.payload
    await updataUser(uid, scanner.client)
}

export async function handleUpdateUserEvent(event: any, scanner: any) {
    let { uid } = event.payload
    await updataUser(uid, scanner.client)
}

export async function handlePublishProductEvent(event: any, scanner: any) {
    let { pid } = event.payload
    let product = await Product.findOneBy({ pid })
    if (product == null) {
        product = new Product()
        product.pid = pid
    }
    let p = await scanner.client.invokeView(CONTRACT_BITSFLEA, "getProduct", null, [pid])
    let des = await scanner.ipfs.getJSON(p.description)

    product.uid = p.uid
    product.description = p.description
    product.name = des.name
    product.category = p.category
    product.status = p.status
    product.isNew = p.isNew
    product.isReturns = p.isReturns
    product.reviewer = null
    product.saleMethod = p.saleMethod
    product.price = multyAssetToString(p.price)
    product.pickupMethod = p.pickupMethod
    product.stockCount = p.stockCount
    product.isRetail = p.isRetail
    product.postage = multyAssetToString(p.postage)
    product.position = p.position
    product.publishTime = p.publishTime
    await product.save()
}

export async function handleDelistProductEvent(event: any, scanner: any) {
    let { pid } = event.payload
    let product = await Product.findOneBy({ pid })
    if (product) {
        product.status = 300
        await product.save()
    }
}

export async function handleCreateReviewerEvent(event: any, scanner: any) {
    let { uid, createTime } = event.payload
    let reviewer = await Reviewer.findOneBy({ uid })
    if (reviewer == null) {
        reviewer = new Reviewer()
        reviewer.uid = uid
    }
    reviewer.createTime = createTime
    reviewer.lastActiveTime = createTime
    await reviewer.save()
}

export async function handleVoteReviewerEvent(event: any, scanner: any) {
    let { voter, reviewer, approveCount, againstCount } = event.payload
    let rev = await Reviewer.findOneBy({ uid: reviewer })
    if (rev) {
        rev.againstCount = againstCount
        rev.approveCount = approveCount
        if (rev.voted) {
            let vObj = JSON.parse(rev.voted)
            vObj[voter] = true
            rev.voted = JSON.stringify(vObj)
        } else {
            let vObj = {}
            vObj[voter] = true
            rev.voted = JSON.stringify(vObj)
        }
        await rev.save()
    }
}

export async function handleReviewProductEvent(event: any, scanner: any) {
    let { pid, reviewer, isDelist, reviewTime } = event.payload
    let product = await Product.findOneBy({ pid })
    if (product) {
        product.status = isDelist ? 300 : 100
        product.reviewer = reviewer
        await product.save()

        let user = await User.findOneBy({ uid: product.uid })
        if (user) {
            user.postsTotal += 1
            await user.save()
        }
    }
    let rev = await Reviewer.findOneBy({ uid: reviewer })
    if (rev) {
        rev.lastActiveTime = reviewTime
    }
}

export async function handleCreateOrderEvent(event: any, scanner: any) {
    let { oid, pid, seller, buyer, amount, postage, createTime, payTimeOut } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order == null) {
        order = new Order()
        order.oid = oid
    }

    order.pid = pid
    order.seller = seller
    order.buyer = buyer
    order.amount = multyAssetToString(amount)
    order.postage = multyAssetToString(postage)
    order.createTime = createTime
    order.payTimeOut = payTimeOut
    await order.save()

    let product = await Product.findOneBy({ pid })
    if (product) {
        let p = await scanner.client.invokeView(CONTRACT_BITSFLEA, "getProduct", null, [pid])
        product.stockCount = p.stockCount
        product.status = p.status
        await product.save()
    }
}

export async function handlePayOrderEvent(event: any, scanner: any) {
    let { oid, status, payTime, shipTimeOut } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order) {
        order.status = status
        order.payTime = payTime
        order.shipTimeOut = shipTimeOut
        await order.save()
    }
}

export async function handleCancelOrderEvent(event: any, scanner: any) {
    let { oid, pid, buyer, time } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order) {
        order.status = 200
        await order.save()

        if (order.payTimeOut < time) {
            let [g, user] = await Promise.all([
                getGlobal(scanner.client),
                User.findOneBy({ uid: buyer })
            ])
            if (g && user) {
                await subCredit(g, user, g.creditPayTimeOut)
            }
        }
    }

    let product = await Product.findOneBy({ pid })
    if (product) {
        product.status = 100
        await product.save()
    }
}

export async function handleShipmentsEvent(event: any, scanner: any) {
    let { oid, number, status, time } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order) {
        let g = await getGlobal(scanner.client)
        if (order.status == 800) {
            let pr = await ProductReturn.findOneBy({ oid })
            if (pr) {
                pr.status = status
                pr.shipTime = time
                pr.shipmentsNumber = number
                pr.receiptTimeOut = time + g.receiptTimeOut;
                await pr.save()

                if (time > pr.shipTimeOut) {
                    let buyer = await User.findOneBy({ uid: order.buyer })
                    await subCredit(g, buyer, g.creditShipmentsTimeout)
                }
            }
        } else {
            order.shipmentNumber = number
            order.shipTime = time
            order.status = status
            order.receiptTimeOut = time + g.receiptTimeOut
            await order.save()

            if (time > order.shipTimeOut) {
                let seller = await User.findOneBy({ uid: order.seller })
                await subCredit(g, seller, g.creditShipmentsTimeout)
            }
        }
    }
}

export async function handleReturnEvent(event: any, scanner: any) {
    let { oid, pid, buyer } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order) {
        order.status = 800
        await order.save()

        let pr = await getProductReturn(scanner.client, oid)
        if (pr) {
            let localPr = new ProductReturn()
            localPr.oid = pr.oid
            localPr.pid = pr.pid
            localPr.status = pr.status
            localPr.reasons = pr.reasons
            localPr.createTime = pr.createTime
            localPr.shipTimeOut = pr.shipTimeOut
            await localPr.save()
        }
    }
}

export async function handleCompleteOrderEvent(event: any, scanner: any) {
    let { oid, status, time } = event.payload
    let order = await Order.findOneBy({ oid })
    if (order) {
        order.status = status
        order.endTime = time
        order.receiptTime = time
        await order.save()

        let product = await Product.findOneBy({ pid: order.pid })
        if (product) {
            product.status = 200
            await product.save()
        }

        let [g, seller, buyer] = await Promise.all([
            getGlobal(scanner.client),
            User.findOneBy({ uid: order.seller }),
            User.findOneBy({ uid: order.buyer })
        ])
        if (seller) {
            seller.sellTotal += 1;
            seller.creditValue += g.creditCompleteTransaction
            await seller.save()
        }
        if (buyer) {
            buyer.buyTotal += 1
            buyer.creditValue += g.creditCompleteTransaction
            if (order.receiptTimeOut < time) {
                await subCredit(g, buyer, g.creditConfirmReceiptTimeout)
            } else {
                await buyer.save()
            }
        }
    }
}

export async function handleApplyArbitEvent(event: any, scanner: any) {
    let { aid } = event.payload
    let arbitration = await Arbitration.findOneBy({ aid })
    if (arbitration == null) {
        arbitration = new Arbitration()
        arbitration.aid = aid
    }
    let a = await getArbitration(scanner.client, aid)
    if (a) {
        arbitration.plaintiff = a.plaintiff
        arbitration.defendant = a.defendant
        arbitration.pid = a.pid
        arbitration.orderId = a.orderId
        arbitration.type = a.type
        arbitration.status = a.status
        arbitration.operator = a.plaintiff
        arbitration.createTime = a.createTime
        await arbitration.save()
    }
}

export async function handleArbitUpdateEvent(event: any, scanner: any) {
    let { aid, status, operator } = event.payload
    let arbitration = await Arbitration.findOneBy({ aid })
    if (arbitration) {
        arbitration.status = status
        arbitration.operator = operator
        await arbitration.save()

        if (status == 300) {    // 完成仲裁
            let [a, g] = await Promise.all([
                await getArbitration(scanner.client, aid),
                await getGlobal(scanner.client)
            ])
            if (a) {
                switch (a.type) {
                    case 0:
                        let order = await Order.findOneBy({ oid: a.orderId })
                        if (a.winner == order.buyer) {
                            let seller = await User.findOneBy({ uid: order.seller })
                            if (seller) {
                                await subCredit(g, seller, g.arbitLosing)
                            }
                        } else {
                            let buyer = await User.findOneBy({ uid: order.buyer })
                            if (buyer) {
                                await subCredit(g, buyer, g.arbitLosing)
                            }
                        }
                        break
                    case 100:
                    case 200:
                    case 300:
                        let uid = a.winner == a.plaintiff ? a.defendant : a.plaintiff
                        let user = await User.findOneBy({ uid })
                        if (user) {
                            await subCredit(g, user, g.arbitLosing)
                        }
                        break
                    default:
                        break
                }
            }
        }
    }
}