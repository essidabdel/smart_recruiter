export function formatScore(score, digits = 0) {
  if (score == null) return 'N/A';
  const pct = Number(score) * 100;
  // if digits is 0, show integer percentage
  return `${pct.toFixed(digits)}%`;
}

export function mapStatus(status) {
  if (!status) return '—';
  switch (status) {
    case 'in_review':
      return 'En cours';
    case 'received':
      return 'Reçue';
    case 'rejected':
      return 'Refusée';
    case 'shortlisted':
      return 'Présélectionné';
    case 'hired':
      return 'Embauché';
    case 'open':
      return 'Ouvert';
    case 'closed':
      return 'Fermé';
    default:
      // convert snake_case to spaced words and capitalise
      return String(status).replace(/_/g, ' ');
  }
}

export default { formatScore, mapStatus };
