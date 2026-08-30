import type { AIComputeProvider } from "@/lib/ai/provider";
import { ModalComputeProvider } from "@/lib/ai/providers/modal";

let cachedProvider: AIComputeProvider | null = null;

/**
 * Returns the configured AIComputeProvider. Selection is driven by
 * AI_COMPUTE_PROVIDER so a future provider (RunPod, AWS, Lambda, Vast.ai,
 * a dedicated GPU server) can be swapped in without changing call sites.
 */
export function getComputeProvider(): AIComputeProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_COMPUTE_PROVIDER ?? "modal";

  switch (providerName) {
    case "modal":
      cachedProvider = new ModalComputeProvider(process.env.AI_ORCHESTRATOR_URL ?? "");
      break;
    default:
      throw new Error(`Unknown AI_COMPUTE_PROVIDER: "${providerName}".`);
  }

  return cachedProvider;
}
