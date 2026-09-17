const keyMap = new Map();

function saveKey(cid, key) {
  keyMap.set(cid, key);
}

function getKey(cid) {
  return keyMap.get(cid);
}

module.exports = { saveKey, getKey };