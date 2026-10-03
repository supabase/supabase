// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
//
// PKCS #3: Diffie-Hellman Key Agreement Standard

use der::Sequence;
use spki::der;
use spki::der::asn1;

// The parameters fields associated with OID dhKeyAgreement
//
// DHParameter ::= SEQUENCE {
//  prime INTEGER, -- p
//  base INTEGER, -- g
//  privateValueLength INTEGER OPTIONAL }
#[derive(Clone, Sequence)]
pub struct DhParameter {
  pub prime: asn1::Int,
  pub base: asn1::Int,
  pub private_value_length: Option<asn1::Int>,
}
