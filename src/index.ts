import express, { Application } from 'express';
import { EvmGasProviders } from './providers/evm';
import { getGasEvm, getSolanaGas } from './services/gasService';
import { gasLimitService } from './services/gasLimitService';

const app: Application = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/gas/evm/:chain", async (req, res) => {
  const { chain } = req.params;
  const evmProviders = await EvmGasProviders.create();

  const config = evmProviders.chainExists(chain);
  if (!config) return res.status(400).json({ error: "Unsupported chain" });

  try {
    const data = await getGasEvm(chain, config.blocks);
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch gas price" });
  }
});

app.get("/gas/solana", async (_req, res) => {
  try {
    const data = await getSolanaGas();
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "error" });
  }
});

app.post("/gas-limit", async (req, res) => {
  try {
    const { service, gasLimit, chain, token } = req.body;

    if (!service || !gasLimit)
      return res.status(400).json({ error: "service & gasLimit required" });

    await gasLimitService.recordGasLimit(service, gasLimit, chain, token);

    const result = await gasLimitService.getGasLimit(service, chain, token);

    return res.json(result);
  } catch (err) {
    console.error("POST /gas-limit error:", err);
    res.status(500).json({ error: "internal error" });
  }
});

app.get("/gas-limit/:service", async (req, res) => {
  try {
    const service = req.params.service;
    const { chain, token } = req.query;

    const result = await gasLimitService.getGasLimit(service, chain as string, token as string);

    if (!result)
      return res.status(404).json({ error: "No gas history" });

    return res.json(result);
  } catch (err) {
    console.error("GET /gas-limit error:", err);
    res.status(500).json({ error: "internal error" });
  }
});

app.get("/", (_, res) => {
  res.send("Gas API is running");
});


app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

