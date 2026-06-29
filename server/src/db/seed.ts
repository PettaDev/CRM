import bcrypt from "bcryptjs";
import { getDb } from "./connection";
import { migrate } from "./migrate";

interface SeedUser {
  id: string;
  nome: string;
  email: string;
  senha: string;
  area: string;
  role: string;
}

// Usuários de exemplo (login). Só domínios @carlcare.com / @transsion.com.
const USERS: SeedUser[] = [
  { id: "u-1", nome: "Beatriz Nunes", email: "bia@carlcare.com", senha: "carlcare123", area: "Carlcare", role: "agente" },
  { id: "u-2", nome: "Rafael Lima", email: "rafael@carlcare.com", senha: "carlcare123", area: "Carlcare", role: "agente" },
  { id: "u-3", nome: "Camila Duarte", email: "camila@carlcare.com", senha: "carlcare123", area: "TFAE", role: "agente" },
  { id: "u-4", nome: "Priscila Rocha", email: "priscila@transsion.com", senha: "transsion123", area: "HQ", role: "gestor" },
];

// Timestamps relativos para a UI ("há X min/h/d") ficar realista.
const now = Date.now();
const h = (n: number): string => new Date(now - n * 3_600_000).toISOString();
const d = (n: number): string => h(n * 24);

interface SeedCase {
  id: string;
  cliente: string;
  telefone: string;
  cidade: string;
  estado: string;
  marca: string;
  modelo: string;
  imei: string;
  defeito: string;
  status: string;
  area: string;
  responsavel: string;
  createdAt: string;
  updatedAt: string;
}

const CASES: SeedCase[] = [
  { id: "CC-2026-0001", cliente: "Marcos Andrade", telefone: "+55 11 98123-4567", cidade: "São Paulo", estado: "SP", marca: "TECNO", modelo: "Spark 20 Pro", imei: "356938035643809", defeito: "Tela não liga após queda", status: "em_reparo", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: d(3), updatedAt: h(5) },
  { id: "CC-2026-0002", cliente: "Juliana Prado", telefone: "+55 21 99876-1122", cidade: "Rio de Janeiro", estado: "RJ", marca: "Infinix", modelo: "Note 40", imei: "351265430987612", defeito: "Bateria descarrega muito rápido", status: "aguardando_peca", area: "Carlcare", responsavel: "Rafael Lima", createdAt: d(2), updatedAt: h(20) },
  { id: "CC-2026-0003", cliente: "Anderson Reis", telefone: "+55 31 98555-7788", cidade: "Belo Horizonte", estado: "MG", marca: "itel", modelo: "P55", imei: "359872140033217", defeito: "Não atualiza o sistema (trava no boot)", status: "triagem", area: "TFAE", responsavel: "Camila Duarte", createdAt: h(8), updatedAt: h(2) },
  { id: "CC-2026-0004", cliente: "Patrícia Gomes", telefone: "+55 41 99111-2020", cidade: "Curitiba", estado: "PR", marca: "TECNO", modelo: "Camon 30", imei: "356112998745120", defeito: "Câmera traseira embaçada", status: "pronto", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: d(5), updatedAt: h(30) },
  { id: "CC-2026-0005", cliente: "Felipe Carvalho", telefone: "+55 51 98444-3311", cidade: "Porto Alegre", estado: "RS", marca: "Infinix", modelo: "Hot 50", imei: "350998123456780", defeito: "Alto-falante sem som", status: "novo", area: "Carlcare", responsavel: "Rafael Lima", createdAt: h(1), updatedAt: h(1) },
  { id: "CC-2026-0006", cliente: "Renata Lopes", telefone: "+55 85 99222-4567", cidade: "Fortaleza", estado: "CE", marca: "TECNO", modelo: "Pova 6", imei: "356700991122334", defeito: "Conector de carga solto", status: "finalizado", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: d(7), updatedAt: d(1) },
  { id: "CC-2026-0007", cliente: "Bruno Teixeira", telefone: "+55 62 98777-9090", cidade: "Goiânia", estado: "GO", marca: "itel", modelo: "S24", imei: "359001445566778", defeito: "Touch falhando nas bordas", status: "em_reparo", area: "TFAE", responsavel: "Camila Duarte", createdAt: d(2), updatedAt: h(6) },
  { id: "CC-2026-0008", cliente: "Larissa Souza", telefone: "+55 11 97333-1212", cidade: "Campinas", estado: "SP", marca: "Oraimo", modelo: "FreePods 4", imei: "—", defeito: "Fone direito não pareia", status: "cancelado", area: "Comercial", responsavel: "Diego Martins", createdAt: d(4), updatedAt: d(2) },
  { id: "CC-2026-0009", cliente: "Gustavo Petta", telefone: "+55 11 96000-7788", cidade: "Santo André", estado: "SP", marca: "Infinix", modelo: "Zero 30", imei: "350456778899001", defeito: "Superaquecimento em jogos", status: "triagem", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: h(10), updatedAt: h(3) },
  { id: "CC-2026-0010", cliente: "Eduarda Pires", telefone: "+55 71 98123-5566", cidade: "Salvador", estado: "BA", marca: "TECNO", modelo: "Spark Go 2024", imei: "356221009988776", defeito: "Microfone com ruído nas chamadas", status: "aguardando_peca", area: "Carlcare", responsavel: "Rafael Lima", createdAt: d(3), updatedAt: h(26) },
  { id: "CC-2026-0011", cliente: "Thiago Farias", telefone: "+55 11 95555-0001", cidade: "Guarulhos", estado: "SP", marca: "Infinix", modelo: "Smart 8", imei: "350112233445566", defeito: "Não reconhece o chip", status: "novo", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: h(2), updatedAt: h(2) },
  { id: "CC-2026-0012", cliente: "Vanessa Moreira", telefone: "+55 27 99888-3344", cidade: "Vitória", estado: "ES", marca: "itel", modelo: "A70", imei: "359334455667788", defeito: "Botão de volume travado", status: "pronto", area: "Carlcare", responsavel: "Rafael Lima", createdAt: d(4), updatedAt: h(28) },
  { id: "CC-2026-0013", cliente: "Otávio Ramos", telefone: "+55 47 98222-7711", cidade: "Joinville", estado: "SC", marca: "TECNO", modelo: "Phantom V Fold 2", imei: "356889900112233", defeito: "Dobradiça com folga", status: "em_reparo", area: "TFAE", responsavel: "Camila Duarte", createdAt: d(6), updatedAt: h(12) },
  { id: "CC-2026-0014", cliente: "Sabrina Alves", telefone: "+55 81 99777-2233", cidade: "Recife", estado: "PE", marca: "Infinix", modelo: "Note 40 Pro", imei: "350778899001122", defeito: "Carregamento turbo não funciona", status: "finalizado", area: "Carlcare", responsavel: "Beatriz Nunes", createdAt: d(9), updatedAt: d(2) },
];

interface SeedForm {
  nomeCompleto: string; cpf: string; nascimento: string; email: string;
  cep: string; rua: string; numero: string; bairro: string; cidade: string; estado: string;
  marca: string; modelo: string; imei1: string; imei2: string; sn: string; notaFiscal: string;
  consentimentoLgpd: boolean;
}
interface SeedClient {
  telefoneKey: string; telefone: string; formStatus: string;
  enviadoAt?: string; preenchidoAt?: string; form?: SeedForm;
}

const CLIENTS: SeedClient[] = [
  { telefoneKey: "5511981234567", telefone: "+55 11 98123-4567", formStatus: "preenchido", enviadoAt: d(3), preenchidoAt: d(3), form: { nomeCompleto: "Marcos Andrade Silva", cpf: "123.456.789-00", nascimento: "1990-03-12", email: "marcos.andrade@email.com", cep: "01310-200", rua: "Av. Paulista", numero: "1578", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP", marca: "TECNO", modelo: "Spark 20 Pro", imei1: "356938035643809", imei2: "356938035643817", sn: "TSP20P24A001923", notaFiscal: "NF-882431", consentimentoLgpd: true } },
  { telefoneKey: "5541991112020", telefone: "+55 41 99111-2020", formStatus: "preenchido", enviadoAt: d(5), preenchidoAt: d(5), form: { nomeCompleto: "Patrícia Gomes de Oliveira", cpf: "987.654.321-00", nascimento: "1985-11-02", email: "patricia.gomes@email.com", cep: "80010-010", rua: "Rua XV de Novembro", numero: "420", bairro: "Centro", cidade: "Curitiba", estado: "PR", marca: "TECNO", modelo: "Camon 30", imei1: "356112998745120", imei2: "356112998745138", sn: "TCAM30A5512XK", notaFiscal: "NF-771209", consentimentoLgpd: true } },
  { telefoneKey: "5521998761122", telefone: "+55 21 99876-1122", formStatus: "preenchido", enviadoAt: d(2), preenchidoAt: h(20), form: { nomeCompleto: "Juliana Prado Martins", cpf: "456.789.123-00", nascimento: "1993-07-21", email: "ju.prado@email.com", cep: "22041-001", rua: "Av. N. S. de Copacabana", numero: "905", bairro: "Copacabana", cidade: "Rio de Janeiro", estado: "RJ", marca: "Infinix", modelo: "Note 40", imei1: "351265430987612", imei2: "351265430987620", sn: "INF40N9921Q7", notaFiscal: "NF-665512", consentimentoLgpd: true } },
  { telefoneKey: "5551984443311", telefone: "+55 51 98444-3311", formStatus: "enviado", enviadoAt: h(1) },
  { telefoneKey: "5511960007788", telefone: "+55 11 96000-7788", formStatus: "enviado", enviadoAt: h(2.5) },
  { telefoneKey: "5511955550001", telefone: "+55 11 95555-0001", formStatus: "nao_enviado" },
];

interface SeedMessage { id: string; from: string; text: string; at: string }
interface SeedConv {
  id: string; caseId: string; cliente: string; telefone: string; unread: number; lastAt: string; messages: SeedMessage[];
}

const CONVERSATIONS: SeedConv[] = [
  { id: "cv-1", caseId: "CC-2026-0005", cliente: "Felipe Carvalho", telefone: "+55 51 98444-3311", unread: 2, lastAt: h(0.3), messages: [
    { id: "cv1-m1", from: "cliente", text: "Oi, meu Infinix Hot 50 está sem som no alto-falante.", at: h(1.1) },
    { id: "cv1-m2", from: "agente", text: "Olá, Felipe! Sou a Beatriz da Carlcare. Consegue me confirmar o IMEI do aparelho?", at: h(1) },
    { id: "cv1-m3", from: "cliente", text: "350998123456780", at: h(0.5) },
    { id: "cv1-m4", from: "cliente", text: "Tem como verem hoje?", at: h(0.3) },
  ] },
  { id: "cv-2", caseId: "CC-2026-0011", cliente: "Thiago Farias", telefone: "+55 11 95555-0001", unread: 1, lastAt: h(1.8), messages: [
    { id: "cv2-m1", from: "cliente", text: "Boa tarde, o Smart 8 parou de reconhecer o chip.", at: h(2) },
    { id: "cv2-m2", from: "agente", text: "Boa tarde, Thiago! Abri o atendimento CC-2026-0011 pra você.", at: h(1.9) },
    { id: "cv2-m3", from: "cliente", text: "Testei com outro chip também e nada.", at: h(1.8) },
  ] },
  { id: "cv-3", caseId: "CC-2026-0004", cliente: "Patrícia Gomes", telefone: "+55 41 99111-2020", unread: 0, lastAt: h(30), messages: [
    { id: "cv3-m1", from: "cliente", text: "Alguma novidade da câmera do meu Camon 30?", at: h(31) },
    { id: "cv3-m2", from: "agente", text: "Sim! O reparo foi concluído e o aparelho já está pronto pra retirada. 🎉", at: h(30) },
  ] },
  { id: "cv-4", caseId: "CC-2026-0001", cliente: "Marcos Andrade", telefone: "+55 11 98123-4567", unread: 0, lastAt: h(5), messages: [
    { id: "cv4-m1", from: "cliente", text: "A tela do meu Spark 20 Pro não liga depois que caiu.", at: d(3) },
    { id: "cv4-m2", from: "agente", text: "Recebemos seu aparelho e abrimos o atendimento CC-2026-0001.", at: d(3) },
    { id: "cv4-m3", from: "agente", text: "Atualização: o display chegou e o reparo já está em andamento.", at: h(5) },
  ] },
  { id: "cv-5", caseId: "CC-2026-0009", cliente: "Gustavo Petta", telefone: "+55 11 96000-7788", unread: 3, lastAt: h(0.1), messages: [
    { id: "cv5-m1", from: "cliente", text: "Meu Zero 30 esquenta muito quando jogo.", at: h(10) },
    { id: "cv5-m2", from: "agente", text: "Obrigada por avisar, Gustavo. Estamos fazendo um teste de estresse térmico.", at: h(3) },
    { id: "cv5-m3", from: "cliente", text: "Consigo um aparelho reserva? É meu telefone de trabalho 😅", at: h(0.1) },
  ] },
  { id: "cv-6", caseId: "CC-2026-0002", cliente: "Juliana Prado", telefone: "+55 21 99876-1122", unread: 0, lastAt: h(20), messages: [
    { id: "cv6-m1", from: "cliente", text: "A bateria do Note 40 não dura nada.", at: d(2) },
    { id: "cv6-m2", from: "agente", text: "Identificamos que a bateria precisa ser substituída. Já solicitamos a peça.", at: h(20) },
  ] },
];

function seed(): void {
  migrate();
  const db = getDb();

  const insCase = db.prepare(
    `INSERT INTO cases (id, cliente, telefone, cidade, estado, marca, modelo, imei, defeito, status, area, responsavel, canal, created_at, updated_at)
     VALUES (@id, @cliente, @telefone, @cidade, @estado, @marca, @modelo, @imei, @defeito, @status, @area, @responsavel, @canal, @createdAt, @updatedAt)`
  );
  const insEvent = db.prepare(
    "INSERT INTO case_status_events (case_id, status, at, by_who, note) VALUES (?, ?, ?, ?, ?)"
  );
  const insClient = db.prepare(
    "INSERT INTO clients (telefone_key, telefone, form_status, enviado_at, preenchido_at) VALUES (@telefoneKey, @telefone, @formStatus, @enviadoAt, @preenchidoAt)"
  );
  const insForm = db.prepare(
    `INSERT INTO client_forms (telefone_key, nome_completo, cpf, nascimento, email, cep, rua, numero, bairro, cidade, estado, marca, modelo, imei1, imei2, sn, nota_fiscal, consentimento_lgpd)
     VALUES (@telefoneKey, @nomeCompleto, @cpf, @nascimento, @email, @cep, @rua, @numero, @bairro, @cidade, @estado, @marca, @modelo, @imei1, @imei2, @sn, @notaFiscal, @consentimento)`
  );
  const insConv = db.prepare(
    "INSERT INTO conversations (id, case_id, cliente, telefone, unread, last_at) VALUES (@id, @caseId, @cliente, @telefone, @unread, @lastAt)"
  );
  const insMsg = db.prepare(
    "INSERT INTO messages (id, conversation_id, sender, text, at) VALUES (?, ?, ?, ?, ?)"
  );
  const insUser = db.prepare(
    "INSERT INTO users (id, nome, email, senha_hash, area, role, created_at) VALUES (@id, @nome, @email, @senhaHash, @area, @role, @createdAt)"
  );

  const run = db.transaction(() => {
    // Limpa (ordem respeita as FOREIGN KEYs: filhos antes dos pais).
    db.exec(
      "DELETE FROM messages; DELETE FROM conversations; DELETE FROM case_status_events; DELETE FROM client_forms; DELETE FROM clients; DELETE FROM cases; DELETE FROM users;"
    );

    for (const u of USERS) {
      insUser.run({
        id: u.id,
        nome: u.nome,
        email: u.email,
        senhaHash: bcrypt.hashSync(u.senha, 10),
        area: u.area,
        role: u.role,
        createdAt: new Date().toISOString(),
      });
    }

    for (const c of CASES) {
      insCase.run({ ...c, canal: "WhatsApp" });
      insEvent.run(c.id, "novo", c.createdAt, c.responsavel, null);
      if (c.status !== "novo") {
        insEvent.run(c.id, c.status, c.updatedAt, c.responsavel, null);
      }
    }

    // Marca alguns casos como fora de garantia (alimenta o relatório de defeitos).
    db.prepare(
      "UPDATE cases SET garantia_queda = 1, aparelho_liga = 0 WHERE id = 'CC-2026-0001'"
    ).run();
    db.prepare(
      "UPDATE cases SET garantia_aberto = 1 WHERE id = 'CC-2026-0008'"
    ).run();

    for (const cl of CLIENTS) {
      insClient.run({
        telefoneKey: cl.telefoneKey,
        telefone: cl.telefone,
        formStatus: cl.formStatus,
        enviadoAt: cl.enviadoAt ?? null,
        preenchidoAt: cl.preenchidoAt ?? null,
      });
      if (cl.form) {
        insForm.run({
          telefoneKey: cl.telefoneKey,
          ...cl.form,
          consentimento: cl.form.consentimentoLgpd ? 1 : 0,
        });
      }
    }

    for (const cv of CONVERSATIONS) {
      insConv.run({
        id: cv.id,
        caseId: cv.caseId,
        cliente: cv.cliente,
        telefone: cv.telefone,
        unread: cv.unread,
        lastAt: cv.lastAt,
      });
      for (const m of cv.messages) {
        insMsg.run(m.id, cv.id, m.from, m.text, m.at);
      }
    }
  });

  run();
  console.log(
    `✓ Seed concluído: ${USERS.length} usuários, ${CASES.length} casos, ${CLIENTS.length} clientes, ${CONVERSATIONS.length} conversas.`
  );
}

seed();
