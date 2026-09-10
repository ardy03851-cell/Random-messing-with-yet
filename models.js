// models.js - AI Model Registry & Logos

export const models = [
  {
    id: "moonshotai/kimi-k3",
    name: "Kimi k3",
    provider: "Moonshot AI",
    description: "Advanced reasoning and code generation with long context support.",
    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",
    badge: "Active Key",
    // Custom SVG Logo for Moonshot AI
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00E599"/>
      </svg>
    `
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Industry-leading architectural coding and logical reasoning.",
    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    badge: "Pro Code",
    // Custom SVG Logo for Anthropic / Claude
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.827 3.528h-3.654L4.31 20.472h3.654l1.31-3.673h5.452l1.31 3.673h3.654L13.827 3.528zm-3.328 10.37L12 9.255l1.501 4.643h-3.002z"/>
      </svg>
    `
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Versatile, high-speed multimodal intelligence for full-stack engineering.",
    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    badge: "Fast",
    // Custom SVG Logo for OpenAI
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#00E599"/>
        <path d="M12 8v8M8 12h8" stroke="#00E599" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "deepseek/deepseek-coder",
    name: "DeepSeek Coder V2",
    provider: "DeepSeek",
    description: "Specialized open-weights model trained specifically for software engineering.",
    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    badge: "Specialist",
    // Custom SVG Logo for DeepSeek
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 17l6-6-6-6M12 19h8" stroke="#00E599" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  }
];
