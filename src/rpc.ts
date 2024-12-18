import * as fs from 'fs'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Rpcs {
    directory: string
    filePrefix: string
    methodPrefix: string
    mapping: Record<string, Function>

    constructor(directory: string = "./rpcs", filePrefix: string = 'mapping', methodPrefix: string = 'handle') {
        this.directory = path.resolve(__dirname, directory)
        this.filePrefix = filePrefix
        this.methodPrefix = methodPrefix
        this.mapping = {}
    }

    async loadMappings() {
        // 动态检测文件扩展名
        const fileExtension = __filename.endsWith('.ts') ? '.ts' : '.js';
        // 获取文件列表
        const files = fs.readdirSync(this.directory)
        // 筛选符合条件的文件
        const mappingFiles = files.filter(file =>
            file.startsWith(this.filePrefix) && file.endsWith(fileExtension)
        );
        // 动态导入每个文件的导出
        for (const file of mappingFiles) {
            const filePath = path.resolve(this.directory, file);
            const module = await import(filePath)
            // 遍历导出的内容，将所有函数添加到结果对象
            for (const [key, value] of Object.entries(module)) {
                if (typeof value === 'function') {
                    if (key.startsWith(this.methodPrefix)) {
                        const mKey = key.substring(this.methodPrefix.length).replace(/^./, char => char.toLowerCase())
                        this.mapping[mKey] = value // 以函数名去掉前缀为 key
                    }
                }
            }
        }
        console.debug("RPC mappings:", this.mapping)
    }
}