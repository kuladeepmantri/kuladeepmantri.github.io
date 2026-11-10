/* Compact answer protocol for Kuladeep Mantri. See the private Python decoder. */
(function (root) {
  'use strict';
  function hash(text) { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; }
  function random(seed) {
    let x = seed || 0x6d2b79f5;
    return n => { const limit = Math.floor(4294967296 / n) * n;
      do { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; } while (x >= limit); return x % n; };
  }
  function shuffle(items, draw) { for (let i = items.length - 1; i > 0; i--) { const j = draw(i + 1); [items[i], items[j]] = [items[j], items[i]]; } return items; }
  function nickname(text) { return text.normalize('NFKD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20); }
  function checks(setId) { return shuffle(Array.from({length:100}, (_, i) => i), random(hash(`KMR1-${setId}-checks`))).slice(0, 8); }
  function order(name, setId, mode) {
    const draw = random(hash(`KMR1-${name}-${setId}`));
    const base = shuffle(Array.from({length:mode === 'personal' ? 200 : mode === 'demo' ? 6 : 100}, (_, i) => i), draw);
    if (mode !== 'study') return base.map(index => ({index, repeat:false}));
    const repeated = checks('D7A9187E');
    for (const item of repeated) { const at = base.indexOf(item); if (at >= 40) {
      const eligible = base.slice(0, 40).map((v, i) => repeated.includes(v) ? -1 : i).filter(i => i >= 0);
      const target = eligible[draw(eligible.length)]; [base[at], base[target]] = [base[target], base[at]];
    }}
    const result = base.map(index => ({index, repeat:false}));
    shuffle(repeated, draw).forEach((index, i) => result.splice(65 + i * 6, 0, {index, repeat:true}));
    const controls = shuffle([100,101,102,103], draw);
    [20,45,75,100].forEach((at, i) => result.splice(at, 0, {index:controls[i], repeat:false}));
    return result;
  }
  function checksum(text) {
    let crc = 0xffffffff;
    for (let i = 0; i < text.length; i++) { crc ^= text.charCodeAt(i); for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return ((crc ^ 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function base32(bytes) {
    let bits = 0, value = 0, text = '';
    for (const b of bytes) { value = (value << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; text += alphabet[(value >>> bits) & 31]; } value &= (1 << bits) - 1; }
    if (bits) text += alphabet[(value << (5 - bits)) & 31];
    return text;
  }
  function required(item, mode) { return mode !== 'study' || item.index < 100; }
  function complete(state) {
    const sequence = order(state.name,state.set,state.mode);
    return sequence.every((item,i) => !required(item,state.mode) || [1,2,3,4].includes(state.items[i].answer));
  }
  function encode(state, build) {
    if (!/^[A-Z0-9]{1,20}$/.test(state.name) || !/^[A-F0-9]{8}$/.test(state.session) || !/^[A-F0-9]{12}$/.test(build)) throw new Error('Invalid session');
    const sequence = order(state.name,state.set,state.mode);
    if (state.items.length !== sequence.length || !state.finished || !complete(state)) throw new Error('Required picture answers are incomplete');
    const bytes = [];
    function uint(n) {
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid integer metadata');
      do { const b = n % 128; n = Math.floor(n / 128); bytes.push(b | (n ? 128 : 0)); } while(n);
    }
    function optional(n) { if (n === null || n === undefined) uint(0); else { if (!Number.isSafeInteger(n) || n < 0 || n >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid optional metadata'); uint(n+1); } }
    uint(3); uint({study:1,demo:2,personal:3}[state.mode]); uint(state.background); uint(state.contact);
    uint(state.started); uint(state.finished); uint(state.items.length);
    optional(state.snapshots == null ? null : state.snapshots.length);
    for (const shot of state.snapshots || []) {
      for (const key of ['reason','at','presentation','phase','device','viewport_width','viewport_height','screen_width','screen_height']) optional(shot[key]);
    }
    state.items.forEach((item,i) => {
      if (![0,1,2,3,4].includes(item.answer) || ![0,1,2].includes(item.natural) || (sequence[i].repeat && item.natural)) throw new Error('Invalid answers');
      uint(item.answer | (item.natural << 3));
      uint((item.visited ? 1 : 0) | (item.main_skipped ? 2 : 0) | (item.natural_skipped ? 4 : 0));
      for (const key of ['main_ms','natural_ms']) optional(item[key] == null ? null : Math.round(item[key]));
      for (const key of ['main_timing','natural_timing','changes','natural_changes','zoom','pinch']) optional(item[key]);
      for (let side=0;side<2;side++) {
        const image = item.images?.[side];
        for (const key of ['status','failures','retries']) optional(image?.[key]);
        optional(image?.recovered == null ? null : Number(image.recovered));
      }
    });
    const text = base32(bytes), size = Math.max(320,Math.ceil(text.length/3)), batch = checksum(text);
    const chunks = text.match(new RegExp(`.{1,${size}}`,'g'));
    return chunks.map((chunk,i) => { const payload=`KMR3-${state.name}-${state.session}-${state.set}-${build}-${batch}-${i+1}OF${chunks.length}-${chunk}`; return `${payload}-${checksum(payload)}`; });
  }
  const protocol = {nickname,order,checks,checksum,encode,required,complete};
  if (typeof module !== 'undefined' && module.exports) module.exports = protocol; else root.ReviewProtocol = protocol;
})(typeof window === 'undefined' ? globalThis : window);
