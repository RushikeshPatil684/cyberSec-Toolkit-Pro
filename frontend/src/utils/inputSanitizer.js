const clamp = (value) => (value || '').trim();

const replaceMap = {
  ip: /[^0-9a-fA-F:.\-]/g,
  domain: /[^a-z0-9.-]/g,
  url: /[^A-Za-z0-9-._~:/?#@!$&'()*+,;=%]/g,
  email: /[^A-Za-z0-9.@_+\-]/g,
  hash: /[^A-Fa-f0-9]/g,
};

const validators = {
  ip: /^([0-9]{1,3}\.){3}[0-9]{1,3}$|^[0-9a-fA-F:]+$/,
  domain:
    /^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i,
  url:
    /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  hash: /^[A-Fa-f0-9]{16,512}$/,
};

export function sanitizeInput(value, type = 'text') {
  const trimmed = clamp(value);
  if (!trimmed) return '';

  if (!replaceMap[type]) {
    return trimmed.replace(/[<>]/g, '');
  }

  let sanitized = trimmed.replace(replaceMap[type], '');
  if (type === 'domain' || type === 'email') {
    sanitized = sanitized.toLowerCase();
  }
  return sanitized;
}

export function isValidInput(value, type = 'text') {
  const sanitized = sanitizeInput(value, type);
  if (!sanitized) return false;
  if (!validators[type]) return true;
  return validators[type].test(sanitized);
}

export function sanitizePayload(value, type) {
  const sanitized = sanitizeInput(value, type);
  return sanitized || '';
}

