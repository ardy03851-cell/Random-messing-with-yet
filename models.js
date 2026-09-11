 // models.js - AI Model Registry & Official Company Logos
//
// logoUrl values use official brand assets from the companies
// or their official repositories.

export const models = [
  {
    id: "moonshotai/kimi-k3",
    name: "Kimi K3",
    provider: "Moonshot AI",
    description:
      "Advanced reasoning and code generation with long context support.",

    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",

    badge: "Active Key",

    // Official Kimi brand asset from Kimi's Brand Book.
    logoUrl:
      "https://www.kimi.com/favicon.ico"
  },

  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek v4 flash",
    provider: "DeepSeek",
    description:
      "Fast AI model designed for coding, reasoning and general tasks.",

    apiKey: "sk-GwXuS2_d1UIVFE8Qz6AK_w",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",

    badge: "Active Key",

    // Official DeepSeek logo from their official GitHub repository.
    logoUrl:
      "https://deepseek.com/favicon.ico"
  },

  {
    id: "qwen/qwen2.5-vl-72b-instruct",
    name: "qwen2.5-vl-72b-instruct",
    provider: "Alibaba",
    description:
      "Multimodal qwen model capable of advanced reasoning and coding.",

    apiKey: "sk-T9iFBiaBeF4qdLPrkKy1Tw",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",

    badge: "Active Key",

    // Official OpenAI website favicon/logo asset.
    logoUrl:
      "https://favicon.run/favicon?domain=www.qwen.com&sz=32"
  }, 

  {
    id: "anthropic/claude-sonnet-5",
    name: "Claude 5 Sonnet",
    provider: "Anthropic",
    description:
      "Advanced Claude model with strong coding and reasoning capabilities.",

    apiKey: "sk-wzOmp132WXki8v3Snzx7qQ",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",

    badge: "Active Key",

    // Official Anthropic website favicon/logo asset.
    logoUrl:
      "https://img.icons8.com/?size=100&id=RaW9M9aTjsqW&format=png&color=000000"
  }
];
