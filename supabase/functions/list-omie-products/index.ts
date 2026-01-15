import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  RequestBody,
  OmieListarProdutosResponse,
  OmieProdutoServicoCadastro,
  TransformedProduto,
  FinalResponse,
} from "./types.ts";

const OMIE_API_URL = "https://app.omie.com.br/api/v1/geral/produtos/";
const APP_SECRET_VALIDATION_VALUE = "fabb0719cfcdf3a3b878239e4ea04285";

// WARNING: Store these in Supabase environment variables for production
const BASIC_AUTH_USERNAME = Deno.env.get("BASIC_AUTH_USERNAME") || "development";
const BASIC_AUTH_PASSWORD = Deno.env.get("BASIC_AUTH_PASSWORD") || "RdP102030*";

function transformProduto(p: OmieProdutoServicoCadastro): TransformedProduto {
  return {
    geral: {
      altura: p.altura,
      codigo_familia: p.codigo_familia,
      codigo_produto: p.codigo, // Mapped from 'codigo'
      codigo_produto_omie: p.codigo_produto, // Mapped from 'codigo_produto'
      componentes_kit: p.componentes_kit ?? "",
      descr_detalhada: p.descr_detalhada,
      descr_familia: p.descricao_familia,
      dias_crossdocking: p.dias_crossdocking,
      dias_garantia: p.dias_garantia,
      ean: p.ean,
      exibir_descricao_nfe: p.exibir_descricao_nfe === "S",
      exibir_descricao_pedido: p.exibir_descricao_pedido === "S",
      fator_conv_un_trib: p.fat_trib,
      largura: p.largura,
      marca: p.marca,
      modelo: p.modelo,
      ncm: p.ncm,
      obs_internas: p.obs_internas,
      peso_bruto: p.peso_bruto,
      peso_liquido: p.peso_liq,
      produto: p.descricao, // Mapped from 'descricao'
      profundidade: p.profundidade,
      tabelas_preco: p.tabelas_preco ?? "",
      tipo_item: p.tipoItem,
      unid_medida: p.unidade,
      unid_tributavel: p.unid_trib,
      valor_produto: p.valor_unitario,
      variacao_produto: p.produto_variacao === "S",
    },
    impostos: {
      aliquota_cofins: p.aliquota_cofins,
      aliquota_icms: p.aliquota_icms,
      aliquota_pis: p.aliquota_pis,
      cfop: p.cfop,
      csosn_icms: p.csosn_icms,
      cst_cofins: p.cst_cofins,
      cst_icms: p.cst_icms,
      cst_pis: p.cst_pis,
      modalidade_icms: p.modalidade_icms,
      motivo_deson_icms: p.motivo_deson_icms,
      per_icms_fcp: p.per_icms_fcp,
      red_base_cofins: p.red_base_cofins,
      red_base_icms: p.red_base_icms,
      red_base_pis: p.red_base_pis,
      ibpt: {
        aliqEstadual: p.dadosIbpt?.aliqEstadual,
        aliqFederal: p.dadosIbpt?.aliqFederal,
        aliqMunicipal: p.dadosIbpt?.aliqMunicipal,
        valido_de: p.dadosIbpt?.valido_de,
        valido_ate: p.dadosIbpt?.valido_ate,
      },
      recomendacoes_fiscais: {
        cnpj_fabricante: p.recomendacoes_fiscais?.cnpj_fabricante,
        cupom_fiscal: p.recomendacoes_fiscais?.cupom_fiscal === "S",
        id_cest: p.recomendacoes_fiscais?.id_cest ?? "",
        id_preco_tabelado: p.recomendacoes_fiscais?.id_preco_tabelado,
        origem_mercadoria: p.recomendacoes_fiscais?.origem_mercadoria,
      },
    },
    status: {
      alteracao_data: p.info?.dAlt,
      alteracao_hora: p.info?.hAlt,
      alteracao_usuario: p.info?.uAlt,
      inclusao_data: p.info?.dInc,
      inclusao_hora: p.info?.hInc,
      inclusao_usuario: p.info?.uInc,
      atualizar_preco_kit: p.kit_upreco === "S",
      bloqueado: p.bloqueado === "S",
      bloquear_exclusao: p.bloquear_exclusao === "S",
      inativo: p.inativo === "S",
    },
  };
}

async function fetchOmiePage(
  appKey: string,
  appSecret: string,
  pageNumber: number
): Promise<OmieProdutoServicoCadastro[]> {
  const body = {
    call: "ListarProdutos",
    app_key: appKey,
    app_secret: appSecret,
    param: [
      {
        pagina: pageNumber,
        registros_por_pagina: 1000, // As per n8n workflow
        filtrar_apenas_omiepdv: "N",
      },
    ],
  };

  const response = await fetch(OMIE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Omie API request failed for page ${pageNumber}: ${response.status} ${response.statusText}`
    );
  }

  const data: OmieListarProdutosResponse = await response.json();

  if (data.faultstring) {
    console.error(`Omie API error for page ${pageNumber}: ${data.faultstring} (Code: ${data.faultcode})`);
    // Depending on requirements, we might want to throw here or return empty
    // For now, let's return empty if a specific page fails but log the error
    return [];
    // Or throw new Error(`Omie API error: ${data.faultstring} (Code: ${data.faultcode})`);
  }
  return data.produto_servico_cadastro || [];
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*", // Or specific origins
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 2. Basic Authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing Basic Auth" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "WWW-Authenticate": 'Basic realm="Supabase Function"' },
    });
  }

  const decodedCreds = atob(authHeader.substring(6)); // "Basic " is 6 chars
  const [username, password] = decodedCreds.split(":");

  if (username !== BASIC_AUTH_USERNAME || password !== BASIC_AUTH_PASSWORD) {
    console.warn("Basic auth failed for user:", username);
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "WWW-Authenticate": 'Basic realm="Supabase Function"' },
    });
  }

  // 3. Check Content-Type and parse request body
  if (req.headers.get("Content-Type") !== "application/json") {
    return new Response(JSON.stringify({ error: "Invalid content type, expected application/json" }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  let requestBody: RequestBody;
  try {
    requestBody = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body: " + e.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { app_key, app_secret } = requestBody;

  if (!app_key || !app_secret) {
    return new Response(JSON.stringify({ error: "Missing app_key or app_secret in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. App Secret Validation (as per n8n Switch25 node)
  if (app_secret !== APP_SECRET_VALIDATION_VALUE) {
    return new Response(JSON.stringify({ response: "CREDENCIAIS INVÁLIDAS!!!" }), {
      status: 403, // Forbidden
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 5. Fetch data from Omie API (pages 1, 2, 3 concurrently)
    // The app_secret from the request body is used for Omie API calls
    const pagesToFetch = [1, 2, 3];
    const omieApiPromises = pagesToFetch.map((pageNumber) =>
      fetchOmiePage(app_key, app_secret, pageNumber)
    );

    const resultsFromOmie = await Promise.all(omieApiPromises);

    const allProdutos: OmieProdutoServicoCadastro[] = resultsFromOmie.flat();

    // 6. Transform data
    const transformedProdutos: TransformedProduto[] = allProdutos.map(transformProduto);

    const finalResponse: FinalResponse = { produtos: transformedProdutos };

    // 7. Return final response
    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Add CORS header for actual response
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error: " + error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

console.log(`Function "list-omie-products" up and running!`);
console.log(`Basic Auth User (from env or default): ${BASIC_AUTH_USERNAME}`);
console.warn("Ensure BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD are set as Supabase Environment Variables for production deployments.");
