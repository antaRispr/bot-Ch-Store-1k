# Serviços personalizados

/criar cadastra um pacote com preço fixo, descrição, prazo e limites. /set publica o botão Solicitar serviço. Produtos existentes também passam a funcionar como serviços; seus dados e estoque anteriores não são apagados, mas o estoque deixa de ser usado.

O cliente informa as funcionalidades em um formulário. O bot cria um canal privado na categoria de carrinhos, visível ao comprador e ao cargo de aprovação (Chef). Combine escopo e prazo antes de pedir pagamento. Recursos fora do pacote exigem um orçamento separado; este fluxo não calcula preços automaticamente.

O cliente consulta PIX e QR Code; o pagamento tem aprovação manual pela equipe. Confira valor e recebimento no banco antes de clicar Aprovar pagamento. O canal permanece aberto, e o cargo Cliente é entregue ao comprador. Pedidos são persistidos no SQLite, e os botões continuam funcionando após reiniciar.

Concluir atendimento é exclusivo da equipe. Cancelar pedido só funciona antes de aprovar o pagamento. Os canais são preservados com mensagens do cliente bloqueadas para consulta. Reembolsos e entrega de arquivos são responsabilidade da equipe. Não solicite tokens ou senhas pelo atendimento.

A atualização muda index.js, events/startCheckout.js, events/createProduct.js, events/showProduct.js, events/editProduct.js, events/addStockProducts.js, commands/Configuration/criar.js, commands/Configuration/set.js, commands/Configuration/gerenciar.js, commands/Configuration/stock.js, commands/Utils/help.js e commands/Utils/estatisticas.js. Preserve config.json, json.sqlite e databases/ na hospedagem. Faça backup antes do deploy e finalize carrinhos antigos: seus botões usavam coletores não persistentes e não são migrados. Publique novos painéis com /set e reinicie.

Após Concluir atendimento, a equipe pode usar Fechar canal e confirmar. O histórico completo (até 8 MB) é enviado ao registro de vendas antes da exclusão. Se o envio falhar, o canal permanece. Links de anexos não substituem backups dos arquivos. A atualização exige events/startCheckout.js e o novo transcript.js na raiz.
