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