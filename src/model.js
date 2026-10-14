export const carClasses = [
  { id: 'sedan', name: 'Седан / купе', factor: 1, hint: 'Базовый тариф' },
  { id: 'crossover', name: 'Кроссовер', factor: 1.25, hint: 'Коэффициент ×1,25' },
  { id: 'suv', name: 'Внедорожник', factor: 1.5, hint: 'Коэффициент ×1,5' },
];
export const services = [
  { id: 'polish', name: 'Полировка кузова', short: 'Полировка', price: 18000, duration: '1–2 дня', text: 'Восстановление глубины цвета и аккуратная коррекция мелких дефектов лакового покрытия.', tags: ['Диагностика ЛКП', 'Коррекция', 'Финиш'] },
  { id: 'ceramic', name: 'Керамическая защита', short: 'Керамика', price: 24000, duration: '1–2 дня', text: 'Защитное покрытие с гидрофобным эффектом. Дополнительный блеск и более простой уход.', tags: ['Подготовка', 'Покрытие', 'Выдержка'] },
  { id: 'film', name: 'Антигравийная плёнка', short: 'Защитная плёнка', price: 65000, duration: '2–3 дня', text: 'Защита передней части автомобиля: капота, бампера, передних крыльев и зеркал.', tags: ['Зона риска', 'Прозрачная защита', 'Точная подгонка'] },
  { id: 'interior', name: 'Детейлинг салона', short: 'Салон', price: 14000, duration: '1 день', text: 'Деликатная очистка кожи, текстиля и труднодоступных деталей. Внимание к каждому материалу.', tags: ['Кожа и текстиль', 'Глубокая очистка', 'Уход'] },
  { id: 'wash', name: 'Детейлинг-мойка', short: 'Детейлинг-мойка', price: 6000, duration: '3–4 часа', text: 'Многоэтапная очистка кузова, дисков и стёкол. Самостоятельная услуга для регулярного ухода.', tags: ['Кузов', 'Диски', 'Стёкла'] },
];
export const money = value => new Intl.NumberFormat('ru-RU').format(value);
export function calculateTotal(carId, serviceIds) {
  const car = carClasses.find(item => item.id === carId);
  if (!car) throw new Error('Неизвестный класс автомобиля');
  const ids = new Set(serviceIds);
  if ([...ids].some(id => !services.some(s => s.id === id))) throw new Error('Неизвестная услуга');
  return services.filter(s => ids.has(s.id)).reduce((sum,s) => sum + Math.round(s.price * car.factor / 100) * 100, 0);
}
export function validateForm({ name, phone, service }, hasEstimate = false) {
  const errors = {};
  if (!/^[\p{L}][\p{L}\s'’\-]{1,59}$/u.test(name.trim())) errors.name = 'Введите имя: от 2 до 60 букв.';
  if (!/^[+\d\s()\-]+$/.test(phone) || !/^[78]\d{10}$/.test(phone.replace(/\D/g,''))) errors.phone = 'Введите 11 цифр: +7 (000) 000-00-00 или 8 (000) 000-00-00.';
  const allowed = ['consultation', ...services.map(s => s.id), ...(hasEstimate ? ['complex'] : [])];
  if (!allowed.includes(service)) errors.service = 'Выберите услугу из списка.';
  return errors;
}
