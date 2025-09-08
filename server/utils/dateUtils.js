import moment from 'moment';

export function getDayName(dateString) {
  const dayIndex = moment(dateString).day(); // 0=Sunday, 6=Saturday
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return days[dayIndex];
}

export function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
