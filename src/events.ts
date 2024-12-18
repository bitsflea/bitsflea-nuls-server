import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import config from "./config"

const { contracts } = config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Events {
    mapping: Record<string, Record<string, Function>>
    templates: Record<string, Function>
    contractPrefix: string
    eventPrefix: string
    templatePrefix: string
    directory: string

    constructor(directory: string, contractPrefix: string = "mapping", eventPrefix: string = "handle", templatePrefix: string = "getAll") {
        this.contractPrefix = contractPrefix
        this.eventPrefix = eventPrefix
        this.templatePrefix = templatePrefix
        this.directory = path.resolve(__dirname, directory)
        this.mapping = {}
        this.templates = {}
    }

    /**
     * 添加新的合约地址映射handle
     * @param address 
     * @param template 
     */
    addNewContract(address: string, template: string) {
        this.mapping[address] = this.mapping[template]
    }

    /**
     * 加载handle
     */
    async loadMappings() {
        // 动态检测文件扩展名
        const fileExtension = __filename.endsWith('.ts') ? '.ts' : '.js';
        // 获取文件列表
        const files = fs.readdirSync(this.directory)
        // 筛选符合条件的文件
        const mappingFiles = files.filter(file =>
            file.startsWith(this.contractPrefix) && file.endsWith(fileExtension)
        );
        // 动态导入每个文件的导出
        for (const file of mappingFiles) {
            const filePath = path.resolve(this.directory, file);
            const module = await import(filePath)
            const handles: Record<string, Function> = {}
            // 遍历导出的内容，将所有函数添加到结果对象
            for (const [key, value] of Object.entries(module)) {
                if (typeof value === 'function') {
                    if (key.startsWith(this.eventPrefix)) {
                        handles[key.substring(this.eventPrefix.length)] = value // 以函数名去掉前缀为 key
                    } else if (key.startsWith(this.templatePrefix)) {
                        this.templates[key.substring(this.templatePrefix.length)] = value
                    }
                }
            }
            const mKey = file.substring(this.contractPrefix.length).replace(fileExtension, "")
            this.mapping[contracts[mKey]] = handles
        }
        console.debug("Event mappings:", this.mapping)
    }

    /**
     * 调用handle
     * @param event 
     * @param scanner 
     */
    async processEvent(event: any, scanner: any) {
        let fun = this.mapping[event.contractAddress][event.event]
        if (fun && typeof fun === "function") {
            await fun(event, scanner);
        } else {
            console.warn("No handler found:", event.contractAddress, event.event)
        }
    }
}
