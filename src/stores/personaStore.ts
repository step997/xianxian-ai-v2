import { create } from 'zustand';
import type { Persona } from '../types/shared-types';
import { getPersona, setPersona } from '../utils/storage';

export const PERSONAS: Persona[] = [
  {
    id: 'cat_warm', emoji: '🐱', name: '小暖猫', color: '#FF8C42',
    glow: 'rgba(255,140,66,0.5)', tag: '温暖贴心的小棉袄',
    quote: '我会一直陪着你~', group: '基础萌宠',
  },
  {
    id: 'cat_cool', emoji: '🐾', name: '冷都猫', color: '#4A5568',
    glow: 'rgba(74,85,104,0.5)', tag: '高冷优雅的都市猫',
    quote: '哼，随便你', group: '基础萌宠',
  },
  {
    id: 'panda', emoji: '🐼', name: '憨憨熊猫', color: '#A0AEC0',
    glow: 'rgba(160,174,192,0.5)', tag: '呆萌治愈的国宝',
    quote: '嘿嘿嘿~', group: '基础萌宠',
  },
  {
    id: 'zhuangzi', emoji: '🦋', name: '逍遥庄子', color: '#5A9E8F',
    glow: 'rgba(90,158,143,0.5)', tag: '逍遥游世的梦中蝴蝶',
    quote: '请循其本', group: '先贤智在',
  },
];

export function getPersonaById(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}

interface PersonaState {
  currentPersonaId: string;
  personas: Persona[];
  setCurrentPersonaId: (id: string) => void;
  getCurrentPersona: () => Persona | undefined;
}

export const usePersonaStore = create<PersonaState>()((set, get) => ({
  currentPersonaId: getPersona() || 'cat_warm',
  personas: PERSONAS,

  setCurrentPersonaId: (id: string) => {
    setPersona(id);
    set({ currentPersonaId: id });
  },

  getCurrentPersona: () => {
    return PERSONAS.find((p) => p.id === get().currentPersonaId);
  },
}));
