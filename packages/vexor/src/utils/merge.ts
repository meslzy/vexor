const merge = (target: any, source: any): any => {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...target, ...source];
  }

  if (
    typeof target !== "object" || target === null || Array.isArray(target) ||
    typeof source !== "object" || source === null || Array.isArray(source)
  ) {
    return source;
  }

  const merged = {
    ...target,
  };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      merged[key] = merge(merged[key], source[key]);
    }
  }

  return merged;
};

export {
  merge,
};
