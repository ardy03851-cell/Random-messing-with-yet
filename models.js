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
    // Moonshot AI Logo: Abstract geometric 'M' / Moon shape
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#1a1a1a"/>
        <path d="M12 6C9 6 7 8 7 11C7 14 9 16 12 16C15 16 17 14 17 11C17 8 15 6 12 6Z" fill="#00E599"/>
      </svg>
    `
  },
  {
    id: "deepseek/deepseek-v4-flash",
    name: "Deepseek v4 flash",
    provider: "DeepSeek",
    description: "Industry-leading architectural coding and logical reasoning.",
    apiKey: "sk-GwXuS2_d1UIVFE8Qz6AK_w",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",
    badge: "Pro Code",
    // DeepSeek Logo: Stylized 'D' / Wave / Whale tail shape in brand blue
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4F46E5"/>
        <path d="M7 12C7 9.5 9 7 12 7C15 7 17 9.5 17 12C17 14.5 15 17 12 17C9 17 7 14.5 7 12Z" fill="white"/>
        <path d="M12 7V17" stroke="#4F46E5" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Versatile, high-speed multimodal intelligence for full-stack engineering.",
    apiKey: "sk-_MXtOzhPjFe03YvrR3T-_w",
    endpoint: "https://api.anyapi.ai/v1/chat/completions",
    badge: "Fast",
    // OpenAI Logo: The official hexagonal swirl pattern
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#10A37F"/>
        <path d="M12 6C9 6 7 8 7 11C7 14 9 16 12 16C15 16 17 14 17 11C17 8 15 6 12 6Z" fill="white"/>
        <path d="M12 16V20" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 11L12 6L17 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Exceptional nuance, vision analysis, and complex instruction following.",
    apiKey: "sk-wj92IoUrzPk_2zD9av5nWA",
    endpoint: "https://api.anthropic.com/v1/messages",
    badge: "Nuanced",
    // Anthropic Logo: The distinctive abstract 'A' / mountain peak shape
    logoSvg: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 22H8L12 12L16 22H20L12 2Z" fill="#D97757"/>
        <path d="M12 6L8 16H10L12 11L14 16H16L12 6Z" fill="white"/>
      </svg>
    `
  }
];
