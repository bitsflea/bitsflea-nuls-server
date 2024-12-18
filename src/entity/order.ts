import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class Order extends BaseEntity {
    /**
     * 订单id
     * 下单人地址的hashCode(32位)+商品id(96位)+时间戳(64位)
     */
    @PrimaryColumn()
    oid: string
    /**
     * 商品id
     */
    @Column()
    pid: string
    /**
     * 卖家
     */
    @Column()
    seller: string
    /**
     * 买家
     */
    @Column()
    buyer: string
    /**
     * 订单金额
     */
    @Column({ default: "0" })
    amount: string
    /**
     * 邮费金额
     */
    @Column({ default: "0" })
    postage: string
    /**
     * 订单状态,值对应 OrderStatus
     */
    @Column({ default: 0 })
    status: number
    /**
     * 物流单号
     */
    @Column({ nullable: true })
    shipmentNumber: string
    /**
     * 创建时间
     */
    @Column()
    createTime: number
    /**
     * 支付时间
     */
    @Column({ nullable: true })
    payTime: number
    /**
     * 支付超时时间
     */
    @Column()
    payTimeOut: number
    /**
     * 发货时间
     */
    @Column({ nullable: true })
    shipTime: number
    /**
     * 发货超时时间
     */
    @Column({ nullable: true })
    shipTimeOut: number
    /**
     * 收货时间
     */
    @Column({ nullable: true })
    receiptTime: number
    /**
     * 收货超时时间
     */
    @Column({ nullable: true })
    receiptTimeOut: number
    /**
     * 订单完成时间
     */
    @Column({ nullable: true })
    endTime: number
    /**
     * 延期收货次数
     */
    @Column({ default: 0 })
    delayedCount: number
    /**
     * 订单完成或取消后超过这个时间则可能被清理
     */
    @Column()
    clearTime: number
}