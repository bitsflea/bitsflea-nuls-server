import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class User extends BaseEntity {
    /**
     * 用户地址
     */
    @PrimaryColumn()
    uid: string
    /**
     * 状态，值对应 UserStatus
     */
    @Column()
    status: number
    /**
     * 是否是评审员
     */
    @Column()
    isReviewer: boolean
    /**
     * 昵称
     */
    @Column()
    nickname: string
    /**
     * 头像
     */
    @Column()
    head: string
    /**
     * 电话号hash
     */
    @Column()
    phoneHash: string
    /**
     * 加密过后的电话
     */
    @Column()
    phoneEncrypt: string
    /**
     * 引荐人地址
     */
    @Column({ nullable: true })
    referrer: string
    /**
     * 信用分
     */
    @Column()
    creditValue: number
    /**
     * 最后活跃时间
     */
    @Column()
    lastActiveTime: number
    /**
     * 发布商品总数量
     */
    @Column()
    postsTotal: number
    /**
     * 卖出商品总数量
     */
    @Column()
    sellTotal: number
    /**
     * 买入商品总数量
     */
    @Column()
    buyTotal: number
    /**
     * 引荐总数量
     */
    @Column()
    referralTotal: number
    /**
     * 加密用公钥,为地址公钥
     */
    @Column()
    encryptKey: string
}