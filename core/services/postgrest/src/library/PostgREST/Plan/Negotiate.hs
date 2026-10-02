-- |
-- Module      : PostgREST.Plan.Negotiate
-- Description : PostgREST Content Negotiation
--
-- This module contains logic for content negotiation.
-- RFC: https://datatracker.ietf.org/doc/html/rfc7231#section-3.4
module PostgREST.Plan.Negotiate
  ( negotiateContent
  )
where

import Protolude hiding (from)

import Data.HashMap.Strict qualified as HM

import PostgREST.ApiRequest (ApiRequest (..))
import PostgREST.ApiRequest.Preferences
import PostgREST.ApiRequest.Types
import PostgREST.Catalog.Identifiers
  ( QualifiedIdentifier (..)
  , RelIdentifier (..)
  )
import PostgREST.Catalog.Routine
  ( MediaHandler (..)
  , MediaHandlerMap
  , ResolvedHandler
  )
import PostgREST.Config (AppConfig (..))
import PostgREST.Error (ApiRequestError (..))
import PostgREST.MediaType (MediaType (..))

import PostgREST.MediaType qualified as MediaType

-- We have two general cases of return values from database objects
-- (tables/views/functions):
--
-- 1. "un-mime-typed" values, in most of the cases this is a composite/row
--    value, for example for tables or views, but also often for functions.
--    It can be simple integer values or text or bytea as well.
--
--    For this, we need handlers to transform the "non-mime-typed" values
--    into "mimetypes". We have a default builtin handler that does
--    "application/json". We can add more handlers via aggregates.
--
-- 2. "mime-typed" values, which specifically return a domain type that is
--    associated to a certain mimetype. e.g, a function returning only
--    "image/png".
--
-- FIXME:
--   If the function returns a domain type - let's say image/png, we should
--   accept */*, image/*, and image/png.
--   Related issue: https://github.com/PostgREST/postgrest/issues/3391

-- | Do content negotiation. i.e. choose a media type based on the
--   intersection of accepted/produced media types.
negotiateContent :: AppConfig -> ApiRequest -> QualifiedIdentifier -> [MediaType] -> MediaHandlerMap -> Bool -> Either ApiRequestError ResolvedHandler
negotiateContent conf ApiRequest{iAction = act, iPreferences = Preferences{preferRepresentation = rep}} identifier accepts produces defaultSelect =
  case (act, firstAcceptedPick) of
    (_, Nothing) -> Left . MediaTypeError $ map MediaType.toMime accepts
    (ActDb (ActRelationMut _ _), Just (x, mt)) -> Right (if rep == Just Full then x else NoAgg, mt)
    -- no need for an aggregate on HEAD https://github.com/PostgREST/postgrest/issues/2849
    -- TODO: despite no aggregate, these are responding with a Content-Type, which is not correct.
    (ActDb (ActRelationRead _ True), Just (_, mt)) -> Right (NoAgg, mt)
    (ActDb (ActRoutine _ (InvRead True)), Just (_, mt)) -> Right (NoAgg, mt)
    (_, Just (x, mt)) -> Right (x, mt)
  where
    firstAcceptedPick = listToMaybe $ mapMaybe matchMT accepts -- If there are multiple accepted media types, pick the first. This is usual in content negotiation.
    matchMT mt = case mt of
      -- all the vendored media types have special handling as they have media type parameters, they cannot be overridden
      m@(MTVndSingularJSON strip) -> Just (BuiltinAggSingleJson strip, m)
      m@MTVndArrayJSONStrip -> Just (BuiltinAggArrayJsonStrip, m)
      m@(MTVndPlan (MTVndSingularJSON strip) _ _) -> mtPlanToNothing $ Just (BuiltinAggSingleJson strip, m)
      m@(MTVndPlan MTVndArrayJSONStrip _ _) -> mtPlanToNothing $ Just (BuiltinAggArrayJsonStrip, m)
      -- TODO the plan should have its own MediaHandler instead of relying on MediaType
      m@(MTVndPlan mType _ _) -> mtPlanToNothing $ ((,) . fst <$> lookupHandler mType) <*> pure m
      -- all the other media types can be overridden
      x -> lookupHandler x
    mtPlanToNothing x = if configDbPlanEnabled conf then x else Nothing -- don't find anything if the plan media type is not allowed
    lookupHandler mt =
      when' defaultSelect (HM.lookup (RelId identifier, MTAny) produces) -- lookup for identifier and `*/*`
        <|> when' defaultSelect (HM.lookup (RelId identifier, mt) produces) -- lookup for identifier and a particular media type
        <|> HM.lookup (RelAnyElement, mt) produces -- lookup for anyelement and a particular media type
    when' :: Bool -> Maybe a -> Maybe a
    when' True (Just a) = Just a
    when' _ _ = Nothing
