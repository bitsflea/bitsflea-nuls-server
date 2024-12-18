
import "reflect-metadata"
import { DataSource } from "typeorm"
import config from "./config"
import { User } from "./entity/user"
import { Product } from "./entity/product"
import { Reviewer } from "./entity/reviewer"
import { Order } from "./entity/order"
import { ProductReturn } from "./entity/productReturn"
import { Arbitration } from "./entity/arbitration"

const { db_host, db_port, db_username, db_password, db_name } = config

export const AppDataSource = new DataSource({
    type: "mysql",
    host: db_host,
    port: db_port,
    username: db_username,
    password: db_password,
    database: db_name,
    synchronize: true,
    logging: false,
    entities: [User, Product, Reviewer, Order, ProductReturn, Arbitration],
    subscribers: [],
    migrations: [],
})