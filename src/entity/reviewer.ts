import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm"

@Entity()
export class Reviewer extends BaseEntity {
    /**
     * 评审员地址
     */
    @PrimaryColumn()
    uid: string
    /**
     * 创建时间
     */
    @Column()
    createTime: number
    /**
     * 最后活动时间
     */
    @Column()
    lastActiveTime: number
    /**
     * 赞成票数
     */
    @Column({ default: 0 })
    approveCount: number
    /**
     * 反对票
     */
    @Column({ default: 0 })
    againstCount: number
    /**
     * 已经参与投票的用户json字符串
     * Map<地址hashCode,bool>
     */
    @Column({ nullable: true })
    voted: string
}