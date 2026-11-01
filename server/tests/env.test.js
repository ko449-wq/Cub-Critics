const { loadConfig } = require('../config/env');

const dbEnv = { DB_NAME: 'cub', DB_USER: 'me' };

describe('loadConfig', () => {
  test('applies development defaults', () => {
    const c = loadConfig({ ...dbEnv });
    expect(c).toMatchObject({
      nodeEnv: 'development',
      port: 3001,
      trustProxy: 0,
      logLevel: 'debug',
    });
    expect(c.allowedOrigins).toEqual([]);
  });

  test('production defaults to one trusted proxy and info logging', () => {
    const c = loadConfig({ ...dbEnv, NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(40) });
    expect(c).toMatchObject({ isProduction: true, trustProxy: 1, logLevel: 'info' });
  });

  test('parses a comma separated origin list', () => {
    const c = loadConfig({
      ...dbEnv,
      ALLOWED_ORIGINS: 'http://localhost:5173, https://cubcritics.example',
    });
    expect(c.allowedOrigins).toEqual(['http://localhost:5173', 'https://cubcritics.example']);
  });

  test('accepts DATABASE_URL instead of DB_* values', () => {
    expect(() => loadConfig({ DATABASE_URL: 'postgres://u@h/db' })).not.toThrow();
  });

  test('reports every problem at once', () => {
    expect(() =>
      loadConfig({ NODE_ENV: 'staging', SERVER_PORT: 'abc', ALLOWED_ORIGINS: 'http://x.com/path/' })
    ).toThrow(/NODE_ENV[\s\S]*SERVER_PORT[\s\S]*ALLOWED_ORIGINS[\s\S]*Database is not configured/);
  });

  test('production refuses a missing, default, or short SESSION_SECRET', () => {
    const base = { ...dbEnv, NODE_ENV: 'production' };
    expect(() => loadConfig(base)).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ ...base, SESSION_SECRET: 'change_me' })).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ ...base, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });

  test('test mode does not require a database', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).not.toThrow();
  });
});
