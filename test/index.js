import {hashCode} from "../dist/tools.js"
import jayson from 'jayson'

let m = hashCode("tNULSeBaNBpdDAztEm2FvCwaHrgGjA7VZJaMvA")
console.log(m)

// 创建客户端
const client = jayson.client.http({
    port: 3000, // 服务端端口
    host: 'localhost' // 服务端地址
});

// 调用远程方法 'add'
client.request('getUsers', [1, 10], (err, response) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('Result:', response.result); // 输出 8
});