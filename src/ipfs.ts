import type { Libp2p, ServiceMap } from '@libp2p/interface'
import { createHelia, HeliaLibp2p, libp2pDefaults } from 'helia'
import { mdns } from '@libp2p/mdns'
import { bootstrap } from '@libp2p/bootstrap'
import { json, type JSON } from '@helia/json'
import { CID } from 'multiformats/cid'

export class IPFS {
    helia: HeliaLibp2p<Libp2p<ServiceMap>>
    bootstrapConfig: any
    json: JSON

    constructor() {
        this.bootstrapConfig = {
            list: [
                "/dns4/wss.bitsflea.com/tcp/443/wss/p2p/12D3KooWT36TURqwnygqydMHCT4fFeHdGibgW7EwcWGaj9CEnk3h",
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
                '/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8',
                '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
            ]
        }
    }

    async init() {
        const libp2pOption = libp2pDefaults()
        libp2pOption.peerDiscovery = [
            mdns(),
            bootstrap(this.bootstrapConfig)
        ]
        this.helia = await createHelia({ libp2p: libp2pOption })
        this.json = json(this.helia)
    }

    async getJSON(cid: string) {
        return await this.json.get(CID.parse(cid))
    }
}