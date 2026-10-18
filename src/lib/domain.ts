export function isUnlocked(prerequisites: string[], completed: string[]) {
  const done = new Set(completed);
  return prerequisites.every((id) => done.has(id));
}
export function gradeAnswers(
  questions: { id: string; answer: string }[],
  answers: Record<string, string>,
) {
  return (
    questions.length > 0 &&
    questions.every((q) => answers[q.id]?.trim() === q.answer)
  );
}
export function streakAfter(
  last: string | null,
  current: number,
  today: string,
) {
  if (last === today) return current;
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return last === yesterday.toISOString().slice(0, 10) ? current + 1 : 1;
}
export function activeStreak(
  last: string | null,
  current: number,
  today = new Date().toISOString().slice(0, 10),
) {
  if (!last) return 0;
  const diff = (Date.parse(today) - Date.parse(last)) / 86400000;
  return diff <= 1 ? current : 0;
}
