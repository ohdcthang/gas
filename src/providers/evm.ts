import { CHAIN_DATA } from "../constants/chainDatas"
import Web3 from "web3"

export class EvmGasProviders {
  private BLOCK_NUMBER_CACHED = 100;
  private clientCached: Map<string, Web3> = new Map();
  static instance: EvmGasProviders;
  chains: any = {};

  private constructor() {
    if (EvmGasProviders.instance) {
      return EvmGasProviders.instance;
    }
    EvmGasProviders.instance = this;
  }

  static async create() {
    const self = new EvmGasProviders();
    await self.loadChains();
    return self;
  }

  public async getBlockNumber(chain: string): Promise<number> {
    const client = this.getClient(chain);
    return Number(await client.eth.getBlockNumber());
  }


  public async getLegacyGasPrice(chain: string): Promise<number> {
    const client = this.getClient(chain);
    const gas = await client.eth.getGasPrice();
    return Number(gas);
  }

  public async getEip1559Fees(chain: string) {
    const client = this.getClient(chain);
    const block = await client.eth.getBlock("latest");
  
    const baseFeePerGas = Number(block.baseFeePerGas || 0);
    const maxPriorityFeePerGas = Number(await client.eth.getMaxPriorityFeePerGas());
    const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;
  
    return {
      baseFeePerGas,
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }

  private async loadChains() {
    const request = await fetch('https://general-inventory.coin98.tech/file/ins/settings.json');
    const settings = await request.json();

    this.chains = Object.fromEntries(
      Object.entries(CHAIN_DATA)
        .filter(([_, value]) => value.isWeb3)
        .map(([key, value]) => [
          key,
          { rpc: settings[key] || value.rpcURL, blocks: this.BLOCK_NUMBER_CACHED }
        ])
    );
  }

  private getClient(chain: string){
    if (this.clientCached.has(chain)) {
      return this.clientCached.get(chain)!;
    }
    const rpc = this.chains[chain]?.rpc;
    if (!rpc) {
      throw new Error(`RPC URL not found for chain: ${chain}`);
    }
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc));
    this.clientCached.set(chain, web3);
    return web3;
  } 

  public chainExists(chain: string) {
    return this.chains[chain];
  }
}
