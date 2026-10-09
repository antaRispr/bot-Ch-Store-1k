const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config.json');
const modulePath = require.resolve('../events/startCheckout');
let values, edits, messages, channelsCreated, roleRecipients;
function reset() {
  values = new Map(); edits = []; messages = []; channelsCreated = []; roleRecipients = [];
  global.db = { get: async key => values.has(key) ? structuredClone(values.get(key)) : null, set: async (key, value) => values.set(key, structuredClone(value)), delete: async key => values.delete(key) };
}
function interaction({ action, user = 'buyer', staff = false, modal = false, product = '1' } = {}) {
  const result = [];
  const channel = { id: 'channel', messages: { fetch: async () => ({ edit: async payload => { payload.embeds[0].toJSON(); payload.components.forEach(row => row.toJSON()); edits.push(payload); } }) },
    permissionOverwrites: { edit: async () => {} }, send: async payload => { messages.push(payload); return { id: 'message' }; }, delete: async () => {} };
  const i = { result, customId: modal ? `service_request:${product}` : action ? `service:${action}:order` : `sales-${product}`,
    guildId: 'guild', channelId: 'channel', user: { id: user }, member: { roles: { cache: { has: () => staff } } },
    fields: { getTextInputValue: () => 'Quero um bot com moderação e tickets.' }, client: { user: { id: 'bot' } }, channel,
    guild: { channels: { create: async payload => { channelsCreated.push(payload); return channel; }, fetch: async () => channel }, members: { fetch: async id => ({ roles: { add: async () => roleRecipients.push(id) } }) } },
    isButton: () => !modal, isModalSubmit: () => modal,
    reply: async payload => { i.replied = true; result.push(payload); }, deferReply: async () => { i.deferred = true; },
    editReply: async payload => result.push(payload), followUp: async payload => result.push(payload),
    showModal: async payload => result.push(payload.toJSON()) };
  return i;
}
function order(status = 'pending') {
  const item = { id: 'order', guild: 'guild', channel: 'channel', customer: 'buyer', name: 'Bot personalizado', details: 'Quero tickets.', price: 15, status, message: 'message' };
  values.set('service_order_order', item); values.set('service_active_guild_buyer', 'order'); return item;
}
function handler() { delete require.cache[modulePath]; return require(modulePath); }

test('service without stock opens a persistent private order and prevents a duplicate', async () => {
  reset(); values.set('product_1', { id: '1', name: 'Bot', value: 15 });
  const h = handler(); const click = interaction(); await h.execute(click);
  assert.equal(click.result[0].title, 'Solicitar bot personalizado');
  const submit = interaction({ modal: true }); await h.execute(submit);
  assert.equal(channelsCreated.length, 1);
  const orderId = values.get('service_active_guild_buyer');
  assert(orderId); const saved = values.get(`service_order_${orderId}`);
  assert.equal(saved.customer, 'buyer'); assert.equal(saved.price, 15); assert.equal(saved.status, 'pending');
  const permissions = channelsCreated[0].permissionOverwrites;
  assert(permissions.some(p => p.id === config.sales.cargo_aprovar));
  assert(permissions.some(p => p.id === 'buyer'));
  await handler().execute(interaction({ modal: true }));
  assert.equal(channelsCreated.length, 1);
});

test('buyer cannot approve; staff approval survives restart and cannot be charged twice', async () => {
  reset(); order(); const h = handler();
  await h.execute(interaction({ action: 'approve' }));
  assert.equal(values.get('service_order_order').status, 'pending');
  await h.execute(interaction({ action: 'approve', staff: true, user: 'staff' }));
  const paid = values.get('service_order_order'); assert.equal(paid.status, 'paid'); assert.equal(paid.approvedBy, 'staff'); assert(paid.paidAt);
  assert.deepEqual(roleRecipients, ['buyer']); assert.equal(messages.length, 1);
  await handler().execute(interaction({ action: 'approve', staff: true, user: 'staff' }));
  assert.equal(messages.length, 1); assert.deepEqual(roleRecipients, ['buyer']);
  assert.equal(values.get('service_active_guild_buyer'), 'order');
});

test('paid orders cannot be cancelled by buyer; only staff completes and frees the active order', async () => {
  reset(); order('paid'); const h = handler();
  await h.execute(interaction({ action: 'cancel' })); assert.equal(values.get('service_order_order').status, 'paid');
  await h.execute(interaction({ action: 'complete' })); assert.equal(values.get('service_order_order').status, 'paid');
  await h.execute(interaction({ action: 'complete', staff: true, user: 'staff' }));
  assert.equal(values.get('service_order_order').status, 'completed'); assert(!values.has('service_active_guild_buyer'));
});

test('another customer cannot access order PIX or cancel it', async () => {
  reset(); order(); const h = handler();
  for (const action of ['pix', 'cancel']) {
    const i = interaction({ action, user: 'outsider' }); await h.execute(i);
    assert(i.result[0].content.includes('outro cliente'));
  }
  assert.equal(values.get('service_order_order').status, 'pending');
});
