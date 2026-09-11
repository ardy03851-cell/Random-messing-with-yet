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
    logoUrl: "/icons/kimi.png",
    fallbackUrl:
      "https://kimi-file.kimi.ai/prod-chat-kimi/kfs/4/2/2026-08-12/1d9u61l6dcmosb3skrhr0?x-tos-process=image%2Fauto-orient%2C1%2Fstrip%2Fignore-error%2C1"
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
      "https://raw.githubusercontent.com/deepseek-ai/DeepSeek-LLM/main/images/logo.svg"
  },

  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description:
      "Multimodal OpenAI model capable of advanced reasoning and coding.",

    apiKey: "sk-_MXtOzhPjFe03YvrR3T-_w",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",

    badge: "Active Key",

    // Official OpenAI website favicon/logo asset.
    logoUrl:
      "https://openai.com/favicon.ico"
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
      "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/icons-static/svg/claude-color.svg"
  }
];
