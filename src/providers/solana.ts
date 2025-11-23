import { Connection } from "@solana/web3.js";

export class SolanaProviders {
  private rpcURL: string = "";
  private connection?: Connection
  static instance: SolanaProviders;

  private constructor() {
    if (SolanaProviders.instance) {
      return SolanaProviders.instance;
    }
    SolanaProviders.instance = this;
  }

  static async create() {
    const self = new SolanaProviders();
    await self.loadChains();
    return self;
  }

  private async loadChains() {
    const request = await fetch(
      "https://general-inventory.coin98.tech/file/ins/settings.json"
    );
    const settings = await request.json();

    this.rpcURL = "https://api.mainnet-beta.solana.com";
    this.connection = new Connection(this.rpcURL, { commitment: "confirmed" });
  }

  public async getSolanaBlockHeight() {
    return await this.connection?.getBlockHeight("confirmed");
  }

  public async getRecentPrioritizationFees() {
    const res: any = await (this.connection as any)._rpcRequest("getRecentPrioritizationFees", []);
    if (!res || res.error) throw new Error("Failed getRecentPrioritizationFees: " + JSON.stringify(res.error));
    return res.result
  }
}
