/**
 * Formate un montant en euros avec le symbole €
 * @param amount - Montant à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Montant formaté (ex: "1 234,56 €")
 */
export function formatCurrency(amount: number, locale: string = 'fr-FR'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '0,00 €';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formate un pourcentage avec le symbole %
 * @param value - Valeur décimale (ex: 0.15 pour 15%)
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Pourcentage formaté (ex: "15,0%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0,0%';
  }
  
  const percentage = value * 100;
  return `${percentage.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formate un pourcentage déjà exprimé en pourcentage
 * @param value - Valeur déjà en pourcentage (ex: 1.0 pour 1%, 2.5 pour 2.5%)
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Pourcentage formaté (ex: "1,0%")
 */
export function formatPercentageDirect(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0,0%';
  }
  
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param value - Nombre à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Nombre formaté (ex: "1 234 567")
 */
export function formatNumber(value: number, locale: string = 'fr-FR'): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formate une date en format français
 * @param date - Date à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Date formatée (ex: "15 janvier 2024")
 */
export function formatDate(date: Date, locale: string = 'fr-FR'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Formate une date courte
 * @param date - Date à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Date formatée (ex: "15/01/2024")
 */
export function formatShortDate(date: Date, locale: string = 'fr-FR'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '--/--/----';
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Formate un mois et une année
 * @param date - Date à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Mois/Année formaté (ex: "Janvier 2024")
 */
export function formatMonthYear(date: Date, locale: string = 'fr-FR'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '-- ----';
  }
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long'
  }).format(date);
}

/**
 * Formate une progression avec icône et couleur
 * @param progression - Valeur de progression (-100 à 100)
 * @returns Objet avec icône, couleur et valeur formatée
 */
export function formatProgression(progression: number): {
  icon: string;
  color: string;
  value: string;
} {
  if (progression > 0) {
    return {
      icon: '↗️',
      color: 'text-green-600',
      value: `+${progression.toFixed(1)}%`
    };
  } else if (progression < 0) {
    return {
      icon: '↘️',
      color: 'text-red-600',
      value: `${progression.toFixed(1)}%`
    };
  } else {
    return {
      icon: '→',
      color: 'text-gray-600',
      value: '0,0%'
    };
  }
}

/**
 * Formate un montant en format compact (K, M, B)
 * @param amount - Montant à formater
 * @param locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns Montant formaté compact (ex: "1,2 M€")
 */
export function formatCompactCurrency(amount: number, locale: string = 'fr-FR'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '0 €';
  }
  
  const absAmount = Math.abs(amount);
  let suffix = '';
  let divisor = 1;
  
  if (absAmount >= 1e9) {
    suffix = ' Md€';
    divisor = 1e9;
  } else if (absAmount >= 1e6) {
    suffix = ' M€';
    divisor = 1e6;
  } else if (absAmount >= 1e3) {
    suffix = ' k€';
    divisor = 1e3;
  }
  
  const formattedAmount = (amount / divisor).toFixed(1).replace('.', ',');
  return `${formattedAmount}${suffix}`;
}
