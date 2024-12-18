import sha3 from "js-sha3";

export function hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) | 0; // 使用 | 0 保证结果在32位整数范围内
    }
    return hash;
}

export function multyAssetToString(obj: any): string {
    return `${obj.value},${obj.assetChainId},${obj.assetId}`
}

export function getHashCode(address: string): number {
    const hash = sha3.sha3_256(address)
    const hc = BigInt('0x' + hash);
    return Number(hc >> 224n);
}