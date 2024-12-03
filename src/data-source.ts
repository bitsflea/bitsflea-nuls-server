
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/user"

import config from "./config"

const { db_host, db_port, db_username, db_password } = config

export const AppDataSource = new DataSource({
    type: "mysql",
    host: db_host,
    port: db_port,
    username: db_username,
    password: db_password,
    database: "bitsflea",
    synchronize: true,
    logging: false,
    entities: [User],
    subscribers: [],
    migrations: [],
})