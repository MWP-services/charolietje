export const normalizeEditingUnit = (unit: string) => unit.trim().toLowerCase();

export const getQuickEditStep = (unit: string) => {
  const normalizedUnit = normalizeEditingUnit(unit);
  if (normalizedUnit === 'gram' || normalizedUnit === 'g' || normalizedUnit === 'ml') {
    return 25;
  }

  if (normalizedUnit === 'serving' || normalizedUnit === 'portie') {
    return 0.5;
  }

  return 1;
};

export const getQuickEditPresets = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeEditingUnit(unit);

  if (normalizedUnit === 'gram' || normalizedUnit === 'g' || normalizedUnit === 'ml') {
    return [
      { label: `100 ${normalizedUnit === 'ml' ? 'ml' : 'g'}`, quantity: 100, unit },
      { label: `150 ${normalizedUnit === 'ml' ? 'ml' : 'g'}`, quantity: 150, unit },
      { label: `200 ${normalizedUnit === 'ml' ? 'ml' : 'g'}`, quantity: 200, unit },
    ];
  }

  if (normalizedUnit === 'piece' || normalizedUnit === 'stuk' || normalizedUnit === 'slice') {
    return [
      { label: '1x', quantity: 1, unit },
      { label: '2x', quantity: 2, unit },
      { label: '3x', quantity: 3, unit },
    ];
  }

  return [
    { label: 'Klein', quantity: Math.max(0.5, quantity * 0.75), unit },
    { label: 'Normaal', quantity: Math.max(1, quantity), unit },
    { label: 'Groot', quantity: Math.max(1.5, quantity * 1.25), unit },
  ];
};
