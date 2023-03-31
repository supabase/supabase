// List of available Tax IDs as reflected in Stripe's web portal
// This was manually ported over so there may be a chance of mistakes
// Last updated as of 29th March 2022.
// The code may not necessarily match with the name (ref SE_VAT)
// https://stripe.com/docs/api/customer_tax_ids/create
export interface TaxId {
  name: string
  code: string
  country: string
  placeholder: string
}

export interface StripeTaxId {
  id: string
  type: string
  value: string
  name: string
  country?: string
}

export const TAX_IDS: TaxId[] = [
  {
    name: 'AE TRN',
    code: 'ae_trn',
    country: 'United Arab Emirates',
    placeholder: '123456789012345',
  },
  {
    name: 'AT VAT',
    code: 'eu_vat',
    country: 'Austria',
    placeholder: 'ATU12345678',
  },
  {
    name: 'AU ABN',
    code: 'au_abn',
    country: 'Australia',
    placeholder: '12345678912',
  },
  {
    name: 'AU ARN',
    code: 'au_arn',
    country: 'Australia',
    placeholder: '123456789123',
  },
  {
    name: 'BE VAT',
    code: 'eu_vat',
    country: 'Belgium',
    placeholder: 'BE0123456789',
  },
  {
    name: 'BG VAT',
    code: 'eu_vat',
    country: 'Bulgaria',
    placeholder: 'BG0123456789',
  },
  {
    name: 'BR CNPJ',
    code: 'br_cnpj',
    country: 'Brazil',
    placeholder: '01.234.456/5432-10',
  },
  {
    name: 'BR CPF',
    code: 'br_cpf',
    country: 'Brazil',
    placeholder: '123.456.789-87',
  },
  {
    name: 'CA BN',
    code: 'ca_bn',
    country: 'Canada',
    placeholder: '123456789',
  },
  {
    name: 'CA GST/HST',
    code: 'ca_gst_hst',
    country: 'Canada',
    placeholder: '123456789RT0002',
  },
  {
    name: 'CA PST-BC',
    code: 'ca_pst_bc',
    country: 'Canada',
    placeholder: 'PST-1234-5678',
  },
  {
    name: 'CA PST-MB',
    code: 'ca_pst_mb',
    country: 'Canada',
    placeholder: '123456-7',
  },
  {
    name: 'CA PST-SK',
    code: 'ca_pst_mb',
    country: 'Canada',
    placeholder: '1234567',
  },
  {
    name: 'CA QST',
    code: 'ca_qst',
    country: 'Canada',
    placeholder: '1234567890TQ1234',
  },
  {
    name: 'CH VAT',
    code: 'ch_vat',
    country: 'Switzerland',
    placeholder: 'CHE-123.456.789 MWST',
  },
  {
    name: 'CL TIN',
    code: 'cl_tin',
    country: 'Chile',
    placeholder: '12.345.678-K',
  },
  {
    name: 'CY VAT',
    code: 'eu_vat',
    country: 'Cyprus',
    placeholder: 'CY12345678Z',
  },
  {
    name: 'CZ VAT',
    code: 'eu_vat',
    country: 'Czech Republic',
    placeholder: 'CZ1234567890',
  },
  {
    name: 'DE VAT',
    code: 'eu_vat',
    country: 'Germany',
    placeholder: 'DE123456789',
  },
  {
    name: 'DK VAT',
    code: 'eu_vat',
    country: 'Denmark',
    placeholder: 'DK12345678',
  },
  {
    name: 'EE VAT',
    code: 'eu_vat',
    country: 'Estonia',
    placeholder: 'EE123456789',
  },
  {
    name: 'ES CIF',
    code: 'es_cif',
    country: 'Spain',
    placeholder: 'A12345678',
  },
  {
    name: 'ES VAT',
    code: 'eu_vat',
    country: 'Spain',
    placeholder: 'ESA1234567Z',
  },
  {
    name: 'FI VAT',
    code: 'eu_vat',
    country: 'Finland',
    placeholder: 'FI12345678',
  },
  {
    name: 'FR VAT',
    code: 'eu_vat',
    country: 'France',
    placeholder: 'FRAB123456789',
  },
  {
    name: 'GB VAT',
    code: 'eu_vat',
    country: 'United Kingdom',
    placeholder: 'GB123456789',
  },
  {
    name: 'GE VAT',
    code: 'ge_vat',
    country: 'Georgia',
    placeholder: '123456789',
  },
  {
    name: 'EL VAT',
    code: 'eu_vat',
    country: 'Greece',
    placeholder: 'EL123456789',
  },
  {
    name: 'HK BR',
    code: 'hk_br',
    country: 'Hong Kong SAR China',
    placeholder: '12345678',
  },
  {
    name: 'HR VAT',
    code: 'eu_vat',
    country: 'Croatia',
    placeholder: 'HR12345678912',
  },
  {
    name: 'HU VAT',
    code: 'eu_vat',
    country: 'Hungary',
    placeholder: 'HU12345678912',
  },
  {
    name: 'ID NPWP',
    code: 'id_npwp',
    country: 'Indonesia',
    placeholder: '12.345.678.9-012.345',
  },
  {
    name: 'IE VAT',
    code: 'eu_vat',
    country: 'Ireland',
    placeholder: 'IE1234567AB',
  },
  {
    name: 'IL VAT',
    code: 'il_vat',
    country: 'Israel',
    placeholder: '000012345',
  },
  {
    name: 'IN GST',
    code: 'in_gst',
    country: 'India',
    placeholder: '12ABCDE3456FGZH',
  },
  {
    name: 'IS VAT',
    code: 'is_vat',
    country: 'Iceland',
    placeholder: '123456',
  },
  {
    name: 'IT VAT',
    code: 'eu_vat',
    country: 'Italy',
    placeholder: 'IT12345678912',
  },
  {
    name: 'JP CN',
    code: 'jp_cn',
    country: 'Japan',
    placeholder: '1234567891234',
  },
  {
    name: 'JP RN',
    code: 'jp_rn',
    country: 'Japan',
    placeholder: '12345',
  },
  {
    name: 'KR BRN',
    code: 'kr_brn',
    country: 'Korea',
    placeholder: '123-45-67890',
  },
  {
    name: 'LI UID',
    code: 'li_uid',
    country: 'Liechtenstein',
    placeholder: 'CHE123456789',
  },
  {
    name: 'LT VAT',
    code: 'eu_vat',
    country: 'Lithuania',
    placeholder: 'LT123456789123',
  },
  {
    name: 'LU VAT',
    code: 'eu_vat',
    country: 'Luxembourg',
    placeholder: 'LU12345678',
  },
  {
    name: 'LV VAT',
    code: 'eu_vat',
    country: 'Latvia',
    placeholder: 'LV12345678912',
  },
  {
    name: 'MT VAT',
    code: 'eu_vat',
    country: 'Malta',
    placeholder: 'MT12345678',
  },
  {
    name: 'MX RFC',
    code: 'mx_rfc',
    country: 'Mexico',
    placeholder: 'ABC010203AB9',
  },
  {
    name: 'MY FRP',
    code: 'my_frp',
    country: 'Malaysia',
    placeholder: '12345678',
  },
  {
    name: 'MY ITN',
    code: 'my_itn',
    country: 'Malaysia',
    placeholder: 'C 1234567890',
  },
  {
    name: 'MY SST',
    code: 'my_sst',
    country: 'Malaysia',
    placeholder: 'A12-3456-78912345',
  },
  {
    name: 'NL VAT',
    code: 'eu_vat',
    country: 'Netherlands',
    placeholder: 'NL123456789B12',
  },
  {
    name: 'NO VAT',
    code: 'no_vat',
    country: 'Norway',
    placeholder: '123456789MVA',
  },
  {
    name: 'NZ GST',
    code: 'nz_gst',
    country: 'New Zealand',
    placeholder: '123456789',
  },
  {
    name: 'PL VAT',
    code: 'eu_vat',
    country: 'Poland',
    placeholder: 'PL1234567890',
  },
  {
    name: 'PT VAT',
    code: 'eu_vat',
    country: 'Portugal',
    placeholder: 'PT123456789',
  },
  {
    name: 'RO VAT',
    code: 'eu_vat',
    country: 'Romania',
    placeholder: 'RO1234567891',
  },
  {
    name: 'RU INN',
    code: 'ru_inn',
    country: 'Russia',
    placeholder: '1234567891',
  },
  {
    name: 'RU KPP',
    code: 'ru_kpp',
    country: 'Russia',
    placeholder: '123456789',
  },
  {
    name: 'SA VAT',
    code: 'sa_vat',
    country: 'Saudi Arabia',
    placeholder: '123456789012345',
  },
  {
    name: 'SE VAT',
    code: 'eu_vat',
    country: 'Sweden',
    placeholder: 'SE123456789123',
  },
  {
    name: 'SG GST',
    code: 'sg_gst',
    country: 'Singapore',
    placeholder: 'M12345678X',
  },
  {
    name: 'SG UEN',
    code: 'sg_uen',
    country: 'Singapore',
    placeholder: '123456789F',
  },
  {
    name: 'SI VAT',
    code: 'eu_vat',
    country: 'Slovenia',
    placeholder: 'SI12345678',
  },
  {
    name: 'SK VAT',
    code: 'eu_vat',
    country: 'Slovakia',
    placeholder: 'SK1234567891',
  },
  {
    name: 'TH VAT',
    code: 'th_vat',
    country: 'Thailand',
    placeholder: '1234567891234',
  },
  {
    name: 'TW VAT',
    code: 'tw_vat',
    country: 'Taiwan',
    placeholder: '12345678',
  },
  {
    name: 'UA VAT',
    code: 'ua_vat',
    country: 'Ukraine',
    placeholder: '123456789',
  },
  {
    name: 'US EIN',
    code: 'us_ein',
    country: 'United States',
    placeholder: '12-3456789',
  },
  {
    name: 'XI VAT',
    code: 'eu_vat',
    country: 'United Kingdom (Northern Ireland)',
    placeholder: 'XI123456789',
  },
  {
    name: 'ZA VAT',
    code: 'za_vat',
    country: 'South Africa',
    placeholder: '4123456789',
  },
]
