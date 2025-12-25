
export enum AppMode {
  HOME = 'HOME',
  LIVE = 'LIVE',
  MARKET = 'MARKET',
  AGRICULTURE = 'AGRICULTURE',
  CHRONICLES = 'CHRONICLES',
  TRADING = 'TRADING',
  ASSISTANT = 'ASSISTANT',
  NOTES = 'NOTES',
  VISION = 'VISION',
  CHAT = 'CHAT'
}

export enum LLMSoul {
  GEMINI = 'GEMINI',
  GPT = 'GPT',
  DEEPSEEK = 'DEEPSEEK'
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  color?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeminiResponse {
  text: string;
  sources: GroundingSource[];
}

export interface StoredConversation {
  id: string;
  timestamp: number;
  mode: AppMode;
  soul: LLMSoul;
  query: string;
  response: GeminiResponse;
}

export interface Reminder {
  id: string;
  text: string;
  time: number;
  completed: boolean;
}

export interface AudioProcessingConfig {
  sampleRate: number;
  numChannels: number;
}
