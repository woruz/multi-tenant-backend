const { v4: uuidv4 } = require("uuid");

async function acquireLock(redis, key, ttl = 5000) {
  const lockId = uuidv4();
  const acquired = await redis.set(key, lockId, "NX", "PX", ttl);
  if (!acquired) return null;
  return lockId;
}

async function releaseLock(redis, key, lockId) {
  const lua = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(lua, 1, key, lockId);
}

module.exports = { acquireLock, releaseLock };
