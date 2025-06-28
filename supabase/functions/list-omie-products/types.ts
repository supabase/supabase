// deno-lint-ignore-file camelcase
export interface RequestBody {
  app_key: string;
  app_secret: string; // This is the Omie app_secret, also used for webhook validation
}

export interface OmieProdutoServicoCadastro {
  altura?: number;
  codigo_familia?: string;
  codigo?: string; // codigo_produto in our mapping
  codigo_produto?: number; // codigo_produto_omie in our mapping
  componentes_kit?: string;
  descr_detalhada?: string;
  descricao_familia?: string;
  dias_crossdocking?: number;
  dias_garantia?: number;
  ean?: string;
  exibir_descricao_nfe?: "S" | "N";
  exibir_descricao_pedido?: "S" | "N";
  fat_trib?: number; // fator_conv_un_trib
  largura?: number;
  marca?: string;
  modelo?: string;
  ncm?: string;
  obs_internas?: string;
  peso_bruto?: number;
  peso_liq?: number; // peso_liquido
  descricao?: string; // produto
  profundidade?: number;
  tabelas_preco?: string; // Assuming it's a string, adjust if it's an array/object
  tipoItem?: string; // tipo_item
  unidade?: string; // unid_medida
  unid_trib?: string; // unid_tributavel
  valor_unitario?: number; // valor_produto
  produto_variacao?: "S" | "N"; // variacao_produto

  aliquota_cofins?: number;
  aliquota_icms?: number;
  aliquota_pis?: number;
  cfop?: string;
  csosn_icms?: string;
  cst_cofins?: string;
  cst_icms?: string;
  cst_pis?: string;
  modalidade_icms?: string;
  motivo_deson_icms?: string;
  per_icms_fcp?: number;
  red_base_cofins?: number;
  red_base_icms?: number;
  red_base_pis?: number;

  dadosIbpt?: {
    aliqEstadual?: number;
    aliqFederal?: number;
    aliqMunicipal?: number;
    valido_de?: string;
    valido_ate?: string;
  };

  recomendacoes_fiscais?: {
    cnpj_fabricante?: string;
    cupom_fiscal?: "S" | "N";
    id_cest?: string;
    id_preco_tabelado?: number; // Or string? Assuming number
    origem_mercadoria?: string;
  };

  info?: {
    dAlt?: string; // alteracao_data
    hAlt?: string; // alteracao_hora
    uAlt?: string; // alteracao_usuario
    dInc?: string; // inclusao_data
    hInc?: string; // inclusao_hora
    uInc?: string; // inclusao_usuario
  };

  kit_upreco?: "S" | "N"; // atualizar_preco_kit
  bloqueado?: "S" | "N";
  bloquear_exclusao?: "S" | "N";
  inativo?: "S" | "N";
}

export interface OmieListarProdutosResponse {
  pagina?: number;
  total_de_paginas?: number;
  registros?: number;
  total_de_registros?: number;
  produto_servico_cadastro?: OmieProdutoServicoCadastro[];
  faultstring?: string; // Error message from Omie
  faultcode?: string;   // Error code from Omie
}

export interface TransformedProduto {
  geral: {
    altura?: number;
    codigo_familia?: string;
    codigo_produto?: string; // Mapped from 'codigo'
    codigo_produto_omie?: number; // Mapped from 'codigo_produto'
    componentes_kit: string;
    descr_detalhada?: string;
    descr_familia?: string;
    dias_crossdocking?: number;
    dias_garantia?: number;
    ean?: string;
    exibir_descricao_nfe: boolean;
    exibir_descricao_pedido: boolean;
    fator_conv_un_trib?: number;
    largura?: number;
    marca?: string;
    modelo?: string;
    ncm?: string;
    obs_internas?: string;
    peso_bruto?: number;
    peso_liquido?: number;
    produto?: string; // Mapped from 'descricao'
    profundidade?: number;
    tabelas_preco: string;
    tipo_item?: string;
    unid_medida?: string;
    unid_tributavel?: string;
    valor_produto?: number;
    variacao_produto: boolean;
  };
  impostos: {
    aliquota_cofins?: number;
    aliquota_icms?: number;
    aliquota_pis?: number;
    cfop?: string;
    csosn_icms?: string;
    cst_cofins?: string;
    cst_icms?: string;
    cst_pis?: string;
    modalidade_icms?: string;
    motivo_deson_icms?: string;
    per_icms_fcp?: number;
    red_base_cofins?: number;
    red_base_icms?: number;
    red_base_pis?: number;
    ibpt: {
      aliqEstadual?: number;
      aliqFederal?: number;
      aliqMunicipal?: number;
      valido_de?: string;
      valido_ate?: string;
    };
    recomendacoes_fiscais: {
      cnpj_fabricante?: string;
      cupom_fiscal: boolean;
      id_cest: string;
      id_preco_tabelado?: number;
      origem_mercadoria?: string;
    };
  };
  status: {
    alteracao_data?: string;
    alteracao_hora?: string;
    alteracao_usuario?: string;
    inclusao_data?: string;
    inclusao_hora?: string;
    inclusao_usuario?: string;
    atualizar_preco_kit: boolean;
    bloqueado: boolean;
    bloquear_exclusao: boolean;
    inativo: boolean;
  };
}

export interface FinalResponse {
  produtos: TransformedProduto[];
}
