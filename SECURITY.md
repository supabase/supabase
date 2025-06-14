# Política de Segurança do BibliaPlay.Store

A segurança dos dados dos nossos usuários e a integridade do aplicativo BibliaPlay.Store são de extrema importância para nós. Agradecemos à comunidade de segurança e aos nossos usuários por nos ajudarem a manter nossos sistemas seguros.

## Infraestrutura Segura com Supabase

O BibliaPlay.Store é construído utilizando a plataforma Supabase. O Supabase fornece uma infraestrutura robusta e segura, que inclui:

*   **Banco de Dados PostgreSQL Seguro:** Gerenciado e protegido pela equipe Supabase.
*   **Autenticação:** Supabase Auth lida com o gerenciamento de usuários, senhas (com hashing seguro) e tokens de sessão.
*   **APIs Seguras:** As APIs geradas pelo Supabase utilizam HTTPS por padrão para comunicação criptografada.
*   **Políticas de Acesso (Row Level Security - RLS):** Nós implementamos e mantemos rigorosas políticas de RLS no banco de dados PostgreSQL para garantir que os usuários só possam acessar e modificar os dados aos quais têm permissão explícita.

## Nossas Práticas de Segurança no Aplicativo

Além da segurança fornecida pelo Supabase, implementamos as seguintes práticas no desenvolvimento e manutenção do BibliaPlay.Store:

*   **Validação de Entrada:** Todas as entradas do usuário são validadas no lado do cliente e/ou servidor para prevenir ataques comuns como injeção de SQL (embora o RLS seja a principal defesa) e XSS (Cross-Site Scripting), onde aplicável.
*   **Mínimo Privilégio:** As chaves de API do Supabase usadas no lado do cliente (anon key) têm privilégios limitados, e as operações sensíveis são protegidas por RLS ou executadas através de Edge Functions com as devidas verificações de autorização.
*   **Gerenciamento de Dependências:** Mantemos nossas dependências de software (tanto no frontend quanto em possíveis Edge Functions) atualizadas para mitigar vulnerabilities conhecidas.
*   **Revisão de Código:** Realizamos revisões de código focadas em identificar e corrigir potenciais falhas de segurança.
*   **Configuração Segura do Supabase:** Garantimos que as configurações do nosso projeto Supabase (incluindo RLS, políticas de autenticação e configurações de armazenamento) sigam as melhores práticas de segurança.

## Reportando uma Vulnerabilidade

Se você acredita ter encontrado uma vulnerabilidade de segurança no BibliaPlay.Store ou em qualquer um dos nossos serviços relacionados, por favor, reporte-nos o mais rápido possível. **Pedimos que você não divulgue publicamente a vulnerabilidade até que tenhamos tido a oportunidade de investigá-la e corrigi-la.**

**Como Reportar:**

Por favor, envie um e-mail para:
`seguranca@bibliaplay.store`

**O que incluir no seu relatório:**

Para nos ajudar a entender e corrigir o problema rapidamente, por favor, inclua o máximo de informações possível:

1.  **Tipo de Vulnerabilidade:** (Ex: XSS, Bypass de Autorização, Exposição de Dados Sensíveis, etc.)
2.  **Localização da Vulnerabilidade:** (Ex: Qual tela do app, qual funcionalidade, qual endpoint da API, etc.)
3.  **Descrição Detalhada:** Explique a vulnerabilidade e como ela pode ser explorada.
4.  **Passos para Reproduzir:** Forneça passos claros e concisos para que possamos reproduzir a vulnerabilidade.
5.  **Impacto Potencial:** Descreva o que um invasor poderia fazer explorando esta vulnerabilidade.
6.  **Prova de Conceito (PoC):** (Opcional, mas muito útil) Código, screenshots, vídeos ou qualquer outro material que demonstre a vulnerabilidade.
7.  **Seu Nome/Contato (Opcional):** Se você desejar ser creditado publicamente (após a correção), por favor, nos informe.

**Nosso Compromisso:**

*   Nós confirmaremos o recebimento do seu relatório dentro de 48 horas úteis.
*   Nós investigaremos a vulnerabilidade e trabalharemos para validá-la.
*   Manteremos você informado sobre o progresso da nossa investigação e correção.
*   Nós nos esforçaremos para corrigir vulnerabilidades válidas em tempo hábil.
*   Agradeceremos publicamente aos pesquisadores que reportarem vulnerabilidades de forma responsável, se desejado.

## O que NÃO é Considerado uma Vulnerabilidade (Out of Scope)

Embora apreciemos todos os relatórios, os seguintes itens geralmente não são considerados vulnerabilidades de segurança para o BibliaPlay.Store (a menos que levem a um impacto de segurança demonstrável):

*   Relatórios de scanners automatizados sem prova de conceito manual.
*   Vulnerabilidades que exigem acesso físico ao dispositivo do usuário.
*   Ataques de negação de serviço (DoS/DDoS) contra a infraestrutura do Supabase (eles possuem suas próprias mitigações).
*   Engenharia social direcionada a usuários ou administradores.
*   Self-XSS que não pode ser usado para atacar outros usuários.
*   Divulgação da versão do software/servidor (a menos que uma vulnerabilidade explorável conhecida esteja presente nessa versão).
*   Ausência de "melhores práticas" de segurança que não representem uma vulnerabilidade explorável.

Agradecemos sua ajuda em manter o BibliaPlay.Store seguro para todos os nossos usuários!

---
Data da Última Atualização: 21 de Maio de 2024
---
