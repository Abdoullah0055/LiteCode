"use client";
export function prepareLearningSound(enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !window.AudioContext)
    return () => {};
  try {
    const context = new AudioContext();
    void context.resume();
    let played = false;
    return (success = false) => {
      if (played) return;
      played = true;
      if (!success) {
        void context.close();
        return;
      }
      [523.25, 659.25, 783.99].forEach((hz, i) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0, context.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(
          0.05,
          context.currentTime + i * 0.1 + 0.02,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + i * 0.1 + 0.22,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + i * 0.1);
        oscillator.stop(context.currentTime + i * 0.1 + 0.24);
      });
      setTimeout(() => void context.close(), 600);
    };
  } catch {
    return () => {};
  }
}
