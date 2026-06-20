export function formatPaymentDay(day: number) {
  return `Dia ${day}`;
}

export function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nextPaymentDateFromDay(paymentDay: number, from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(Math.max(paymentDay, 1), daysInMonth);
  let candidate = new Date(Date.UTC(year, month, day));

  const today = new Date(
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()),
  );

  if (candidate < today) {
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const normalizedMonth = nextMonth % 12;
    const nextDaysInMonth = new Date(nextYear, normalizedMonth + 1, 0).getDate();
    const nextDay = Math.min(Math.max(paymentDay, 1), nextDaysInMonth);
    candidate = new Date(Date.UTC(nextYear, normalizedMonth, nextDay));
  }

  return candidate;
}

export const paymentDayOptions = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return { value: String(day), label: `Dia ${day}` };
});
