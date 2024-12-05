
import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class Product extends BaseEntity {
    /**
     * 商品id
     * 由发布者地址的hashCode(32位)+时间戳(64位)
     */
    @PrimaryColumn()
    pid: string

    /**
     * 商品所属人地址
     */
    @Column()
    uid: string
    /**
     * 商品详细说明, 存储在IPFS的url或者cid
     * 格式如下:
     * {"title":"","description":"","photos":[]}
     */
    @Column()
    description: string
    /**
     * 商品分类id
     */
    @Column()
    category: number
    /**
     * 商品状态，值对应ProductStatus
     */
    @Column()
    status: number
    /**
     * 是否全新
     */
    @Column()
    isNew: boolean
    /**
     * 是否支持退货
     */
    @Column()
    isReturns: boolean
    /**
     * 审核人地址
     */
    @Column({ nullable: true })
    reviewer: string
    /**
     * 销售方式, 值对应: SaleMethod
     */
    @Column()
    saleMethod: number
    /**
     * 商品价格
     */
    @Column()
    price: string
    /**
     * 取货方式,值对应: PickupMethod
     */
    @Column()
    pickupMethod: number
    /**
     * 库存数量
     */
    @Column()
    stockCount: number
    /**
     * 是否零售
     */
    @Column()
    isRetail: boolean
    /**
     * 邮费
     */
    @Column()
    postage: string
    /**
     * 位置
     */
    @Column({ nullable: true })
    position: string
    /**
     * 发布时间
     */
    @Column()
    publishTime: number
}