module.exports = async function transcript(channel) {
  const lines = []; let before; let bytes = 0;
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    for (const message of batch.values()) {
      const line = `[${new Date(message.createdTimestamp).toISOString()}] ${message.author.tag} (${message.author.id})\n${message.content || ''}\n${message.embeds.map(e => JSON.stringify(e.toJSON())).join('\n')}\n${[...message.attachments.values()].map(a => a.url).join('\n')}\n`;
      bytes += Buffer.byteLength(line);
      if (bytes > 8 * 1024 * 1024) throw new Error('Histórico excede 8 MB; faça backup manual antes de fechar.');
      lines.push(line);
    }
    before = batch.last().id;
  }
  return Buffer.from(lines.reverse().join('\n') || 'Canal sem mensagens.');
};
