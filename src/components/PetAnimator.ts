export type PetAnimation = 'idle' | 'happy' | 'switch' | 'shake' | 'thinking';

type AnimCallback = () => void;

class PetAnimatorClass {
  private callbacks = new Map<PetAnimation, Set<AnimCallback>>();

  on(anim: PetAnimation, cb: AnimCallback): () => void {
    if (!this.callbacks.has(anim)) this.callbacks.set(anim, new Set());
    this.callbacks.get(anim)!.add(cb);
    return () => this.callbacks.get(anim)?.delete(cb);
  }

  play(anim: PetAnimation): void {
    this.callbacks.get(anim)?.forEach((cb) => cb());
  }
}

export const PetAnimator = new PetAnimatorClass();
