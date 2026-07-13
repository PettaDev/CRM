// Config das planilhas operacionais editáveis. Uma definição por aba:
// mapeia as chaves da API (camelCase) para as colunas do banco (whitelist —
// nada fora daqui entra numa query). Adicionar uma aba nova = 1 entrada aqui
// + a tabela no schema.
export interface SheetDef {
  table: string;
  cols: Record<string, string>; // chave da API → coluna no banco
}

export const SHEETS: Record<string, SheetDef> = {
  trocas: {
    table: "trocas",
    cols: {
      nome: "nome",
      envio: "envio",
      modelo: "modelo",
      imei: "imei",
      modeloNovo: "modelo_novo",
      imeiNovo: "imei_novo",
      gjs: "gjs",
    },
  },
  estoque: {
    table: "estoque_lacrados",
    cols: {
      modelo: "modelo",
      imei: "imei",
      nEstoque: "n_estoque",
      status: "status",
      obs: "obs",
    },
  },
  modelos: {
    table: "modelos_ref",
    cols: {
      marca: "marca",
      codigo: "codigo",
      modelo: "modelo",
      geracao: "geracao",
    },
  },
};

export function getSheet(name: string): SheetDef | undefined {
  return SHEETS[name];
}
