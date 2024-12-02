
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/user.js"

import config from "./config.js"

const { db_host, db_port, db_username, db_password } = config

export const AppDataSource = new DataSource({
    type: "mysql",
    host: db_host,
    port: db_port,
    username: db_username,
    password: db_password,
    database: "bitsflea",
    synchronize: true,
    logging: true,
    entities: [User],
    subscribers: [],
    migrations: [],
})