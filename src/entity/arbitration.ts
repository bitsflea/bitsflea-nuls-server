import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class Arbitration extends BaseEntity {
    /**
     * 记录id
     * 由原告地址hashCode+被告地址hashCode+时间戳
     */
    @PrimaryColumn()
    aid: string
    /**
     * 原告地址
     */
    @Column()
    plaintiff: string
    /**
     * 被告地址
     */
    @Column()
    defendant: string
    /**
     * 商品id
     */
    @Column({ nullable: true })
    pid: string
    /**
     * 订单id
     */
    @Column({ nullable: true })
    orderId: string
    /**
     * 仲裁类型,值对应: ArbitType
     */
    @Column()
    type: number
    /**
     * 仲裁状态,值对应: ArbitStatus
     */
    @Column()
    status: number
    /**
     * 最新操作者
     */
    @Column({ nullable: true })
    operator: string
    /**
     * 创建时间
     */
    @Column()
    createTime:number
}