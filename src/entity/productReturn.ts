
import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class ProductReturn extends BaseEntity {
    /**
     * 订单id
     */
    @PrimaryColumn()
    oid: string
    /**
     * 商品id
     */
    @Column()
    pid: string
    /**
     * 状态
     */
    @Column()
    status: number
    /**
     * 退货原因,实质为存储在IPFS上的一个url,内容为json格式
     */
    @Column({ nullable: true })
    reasons: string
    /**
     * 运单号
     */
    @Column({ nullable: true })
    shipmentsNumber: string
    /**
     * 创建时间
     */
    @Column()
    createTime: number
    /**
     * 发货时间
     */
    @Column({ nullable: true })
    shipTime: number
    /**
     * 发货超时时间
     */
    @Column()
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
     * 完成时间
     */
    @Column({ nullable: true })
    endTime: number
    /**
     * 延期收货次数
     */
    @Column({ default: 0 })
    delayedCount: number
}