# # Sistema completo de gestão de estoque, vendas, caixa e relatórios

Sistema completo de gestão de estoque, vendas, caixa e relatórios . O projeto combina um backend em Java com Spring Boot e um frontend em Next.js para gerenciar produtos, vendas, pagamentos e controle financeiro de forma simples e rápida.

## Visão geral

A aplicação permite:

- cadastrar e controlar produtos no estoque
- registrar vendas e ajustar preços
- acompanhar pagamentos à vista e a prazo
- controlar saldo, gasto com mercadoria e dívida do caixa
- visualizar indicadores e relatórios do desempenho da loja
- gerar uma tabela de cardápio para clientes

## Funcionalidades principais

- Gestão de catálogo de produtos
- Cadastro de marcas, sabores e preços
- Ajuste manual de estoque
- Registro de vendas com faturamento e lucro
- Controle de vendas a prazo com data de vencimento
- Pagamento de fiados diretamente pelo painel
- Dashboard com estatísticas do período
- Geração de mensagem para WhatsApp / cardápio
- Autenticação básica com usuários administrativos

## Stack tecnológico

### Frontend
- Next.js 16
- React 19
- Tailwind CSS
- Recharts
- Lucide React

### Backend
- Java 21
- Spring Boot 4.1.0
- Spring Web MVC
- Spring Data JPA
- Spring Security
- MySQL (configuração principal)
- PostgreSQL também presente nas dependências

## Estrutura do projeto

```text
.
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   └── next.config.ts
├── README.md
└── Dockerfile
```

## Requisitos

- Java 21+
- Maven ou wrapper do projeto (`./mvnw`)
- Node.js 20+
- npm
- MySQL em execução

## Configuração do backend

O backend lê as variáveis de ambiente a seguir:

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/
export SPRING_DATASOURCE_USERNAME=seu_usuario
export SPRING_DATASOURCE_PASSWORD=sua_senha
```

Se preferir, também é possível ajustar os valores diretamente em `backend/src/main/resources/application.properties`.


A aplicação ficará disponível em:

```text
http://localhost:3000
```

## Autenticação

O sistema usa autenticação HTTP Basic com usuários em memória.

## Fluxo principal do sistema

1. Faça login na interface web.
2. Cadastre produtos no catálogo com marca, sabor, estoque e preços.
3. Ajuste o estoque conforme compras e vendas.
4. Registre vendas e pagamentos.
5. Acompanhe o dashboard para faturamento, lucro e pendências.
6. Consulte alertas de vendas a prazo e marque pagamentos realizados.
7. Geração de cardápio / mensagem para clientes.

## Endpoints principais

### Produtos

— lista todos os produtos
— cadastra produto
— remove produto
— ajusta quantidade em estoque
— atualiza preços
— registra venda
— desfaz última venda
— registra venda retroativa

### Vendas

— lista vendas
— desfaz venda por ID
— marca venda a prazo como paga

### Caixa

— consulta saldo e gastos
— atualiza caixa

## Observações importantes

- O frontend usa a URL do backend via `NEXT_PUBLIC_API_URL`, com fallback para deployment em Render/Vercel.
- A aplicação foi pensada para uso interno de gestão de loja, com foco em operação rápida e controle financeiro.
- O projeto está organizado em dois módulos independentes: `backend` e `frontend`.

## Licença

Este projeto não possui licença pública definida no repositório.

## Autor

Projeto desenvolvido para gestão operacional de uma loja com controle de estoque, finanças e vendas.
