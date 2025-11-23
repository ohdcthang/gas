import { redis } from "../redis";

export class GasLimitService {
  private MAX_HISTORY = 10;

  private getKey(service: string, chain?: string, token?: string) {
    if (service === "transfer" && chain && token) {
      return `gas:limit:transfer:${chain}:${token}`;
    }
    return `gas:limit:${service}`;
  }

  async recordGasLimit(service: string, gasLimit: number, chain?: string, token?: string) {
    const key = this.getKey(service, chain, token);

    await redis.lpush(key, gasLimit.toString());

    await redis.ltrim(key, 0, this.MAX_HISTORY - 1);

    return true;
  }

  async getGasLimit(service: string, chain?: string, token?: string) {
    const key = this.getKey(service, chain, token);

    const list = await redis.lrange(key, 0, -1);
    if (list.length === 0) return null;

    const numbers = list.map((v) => Number(v));
    const avg =
      numbers.reduce((a, b) => a + b, 0) / numbers.length;

    const finalGas = Math.round(avg * 2);

    return finalGas
  }
}

export const gasLimitService = new GasLimitService();
