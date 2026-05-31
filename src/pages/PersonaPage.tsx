import { PersonaCard } from '../components/PersonaCard';
import { PERSONAS } from '../stores/personaStore';

export function PersonaPage() {
  const groupIcons: Record<string, string> = { '基础萌宠': '🐱', '先贤智在': '📜' };
  const groups = new Map<string, typeof PERSONAS>();
  for (const p of PERSONAS) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group)!.push(p);
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 24px 28px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontFamily: "'ZCOOL KuaiLe', cursive", marginBottom: 8 }}>
        🎭 选择 AI 人格
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>
        选择不同的 AI 人格，体验不同的对话风格
      </p>
      {Array.from(groups.entries()).map(([group, personas]) => (
        <div key={group} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 12, letterSpacing: 1 }}>
            {(groupIcons[group] || '') + ' ' + group}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {personas.map((p) => <PersonaCard key={p.id} persona={p} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
