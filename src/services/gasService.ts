import { EvmGasProviders } from "../providers/evm";
import { SolanaProviders } from "../providers/solana";
import { redis } from "../redis";

export async function getGasEvm(chain: string, ttlBlocks: number) {
  const ethereumProvider = await EvmGasProviders.create();
  
  const cacheKey = `gas:${chain}`;
  const blockKey = `gas:block:${chain}`;

  const cachedData = await redis.get(cacheKey);
  const cachedBlock = await redis.get(blockKey);

  const currentBlock = await ethereumProvider.getBlockNumber(chain);

  if (cachedData && cachedBlock) {
    const age = currentBlock - Number(cachedBlock);

    if (age < ttlBlocks) {
      return {
        ...JSON.parse(cachedData),
        cached: true,
        currentBlock,
      };
    }
  }

  const legacyGasPrice = await ethereumProvider.getLegacyGasPrice(chain);
  const eip1559 = await ethereumProvider.getEip1559Fees(chain);

  const data = {
    chain,
    legacyGasPrice,
    eip1559,
    cached: false,
    updatedAtBlock: currentBlock,
  };

  await redis.set(cacheKey, JSON.stringify(data));
  await redis.set(blockKey, currentBlock);

  return data;
}

const SOLANA_TTL_BLOCKS = 100

export async function getSolanaGas() {
  const solanaProvider = await SolanaProviders.create();

  const cacheKey = `gas:solana`;
  const blockKey = `gas:block:solana`;

  const cachedRaw = await redis.get(cacheKey);
  const cachedBlockStr = await redis.get(blockKey);

  const currentBlock = await solanaProvider.getSolanaBlockHeight();

  if (cachedRaw && cachedBlockStr) {
    const cachedBlock = Number(cachedBlockStr);
    if (currentBlock !== undefined && currentBlock - cachedBlock < SOLANA_TTL_BLOCKS) {
      return { ...(JSON.parse(cachedRaw)), cached: true, currentBlock };
    }
  }

  const arr = await solanaProvider.getRecentPrioritizationFees();

  const result = {
    chain: "solana",
    currentBlock,
    recent: arr,
    cached: false,
  };

  await redis.set(cacheKey, JSON.stringify(result));
  await redis.set(blockKey, String(currentBlock));

  return result;
}