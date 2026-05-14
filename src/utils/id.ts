export const generateLocalId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
