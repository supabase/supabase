{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE RecordWildCards #-}

-- |
-- Module      : PostgREST.OpenAPI
-- Description : Generates the OpenAPI output
module PostgREST.Response.OpenAPI (encode) where

import Control.Arrow ((&&&))
import Control.Lens (at, (.~), (?~))
import Data.HashMap.Strict.InsOrd (InsOrdHashMap, fromList)
import Data.Maybe (fromJust)
import Data.String (IsString (..))
import Data.Swagger
import Network.URI (URI (..), URIAuth (..))
import Protolude hiding (Proxy, get)

import Data.Aeson qualified as JSON
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as LBS
import Data.HashMap.Strict qualified as HM
import Data.HashSet.InsOrd qualified as Set
import Data.Text qualified as T

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Catalog.Relationship
  ( Cardinality (..)
  , Relationship (..)
  , RelationshipsMap
  )
import PostgREST.Catalog.Routine
  ( FuncVolatility (..)
  , Routine (..)
  , RoutineParam (..)
  )
import PostgREST.Catalog.Table
  ( Column (..)
  , Table (..)
  , TablesMap
  , tableColumnsList
  )
import PostgREST.Config
  ( AppConfig (..)
  , Proxy (..)
  , isMalformedProxyUri
  , toURI
  )
import PostgREST.MediaType
import PostgREST.Network (escapeHostName)
import PostgREST.SchemaCache (SchemaCache (..))

encode :: (Text, Text) -> AppConfig -> SchemaCache -> TablesMap -> HM.HashMap k [Routine] -> Maybe Text -> LBS.ByteString
encode versions conf sCache tables procs schemaDescription =
  JSON.encode $
    postgrestSpec
      versions
      (dbRelationships sCache)
      (concat $ HM.elems procs)
      (snd <$> HM.toList tables)
      (proxyUri conf)
      schemaDescription
      (configOpenApiSecurityActive conf)

makeMimeList :: [MediaType] -> MimeList
makeMimeList cs = MimeList $ fmap (fromString . BS.unpack . toMime) cs

toSwaggerType :: Text -> Maybe (SwaggerType t)
toSwaggerType "character varying" = Just SwaggerString
toSwaggerType "character" = Just SwaggerString
toSwaggerType "text" = Just SwaggerString
toSwaggerType "boolean" = Just SwaggerBoolean
toSwaggerType "smallint" = Just SwaggerInteger
toSwaggerType "integer" = Just SwaggerInteger
toSwaggerType "bigint" = Just SwaggerInteger
toSwaggerType "numeric" = Just SwaggerNumber
toSwaggerType "real" = Just SwaggerNumber
toSwaggerType "double precision" = Just SwaggerNumber
toSwaggerType "json" = Nothing
toSwaggerType "jsonb" = Nothing
toSwaggerType colType = case T.takeEnd 2 colType of
  "[]" -> Just SwaggerArray
  _ -> Just SwaggerString

toSwaggerFormat :: Text -> Maybe Text
toSwaggerFormat "smallint" = Just "int32"
toSwaggerFormat "integer" = Just "int32"
toSwaggerFormat "bigint" = Just "int64"
toSwaggerFormat colType = Just colType

typeFromArray :: Text -> Text
typeFromArray = T.dropEnd 2

toSwaggerTypeFromArray :: Text -> Maybe (SwaggerType t)
toSwaggerTypeFromArray arrType = toSwaggerType $ typeFromArray arrType

makePropertyItems :: Text -> Maybe (Referenced Schema)
makePropertyItems arrType = case toSwaggerType arrType of
  Just SwaggerArray -> Just $ Inline (mempty & type_ .~ toSwaggerTypeFromArray arrType)
  _ -> Nothing

parseDefault :: Text -> Text -> Text
parseDefault colType colDefault =
  case toSwaggerType colType of
    Just SwaggerString -> wrapInQuotations $ case T.stripSuffix ("::" <> colType) colDefault of
      Just def -> T.dropAround (== '\'') def
      Nothing -> colDefault
    _ -> colDefault
  where
    wrapInQuotations text = "\"" <> text <> "\""

makeTableDef :: RelationshipsMap -> Table -> (Text, Schema)
makeTableDef rels t =
  let tn = tableName t
  in  ( tn
      , (mempty :: Schema)
          & description .~ tableDescription t
          & type_ ?~ SwaggerObject
          & properties .~ fromList (makeProperty t rels <$> tableColumnsList t)
          & required .~ fmap colName (filter (not . colNullable) $ tableColumnsList t)
      )

makeProperty :: Table -> RelationshipsMap -> Column -> (Text, Referenced Schema)
makeProperty tbl rels col = (colName col, Inline s)
  where
    e = if null $ colEnum col then Nothing else JSON.decode $ JSON.encode $ colEnum col
    fk :: Maybe Text
    fk =
      let
        searchedRels = fromMaybe mempty $ HM.lookup (QualifiedIdentifier (tableSchema tbl) (tableName tbl), tableSchema tbl) rels
        -- Sorts the relationship list to get tables first
        relsSortedByIsView = sortOn relFTableIsView [r | r@Relationship{} <- searchedRels]
        -- Finds the relationship that has a single column foreign key
        rel =
          find
            ( \case
                Relationship{relCardinality = (M2O _ relColumns)} -> [colName col] == (fst <$> relColumns)
                Relationship{relCardinality = (O2O _ relColumns False)} -> [colName col] == (fst <$> relColumns)
                _ -> False
            )
            relsSortedByIsView
        fCol = (headMay . (\r -> snd <$> relColumns (relCardinality r)) =<< rel)
        fTbl = qiName . relForeignTable <$> rel
        fTblCol = (,) <$> fTbl <*> fCol
      in
        (\(a, b) -> T.intercalate "" ["This is a Foreign Key to `", a, ".", b, "`.<fk table='", a, "' column='", b, "'/>"]) <$> fTblCol
    pk :: Bool
    pk = colName col `elem` tablePKCols tbl
    n =
      catMaybes
        [ Just "Note:"
        , if pk then Just "This is a Primary Key.<pk/>" else Nothing
        , fk
        ]
    d =
      if length n > 1 then
        Just $ T.append (maybe "" (`T.append` "\n\n") $ colDescription col) (T.intercalate "\n" n)
      else
        colDescription col
    s =
      (mempty :: Schema)
        & default_ .~ (JSON.decode . toUtf8Lazy . parseDefault (colType col) =<< colDefault col)
        & description .~ d
        & enum_ .~ e
        & format .~ toSwaggerFormat (colType col)
        & maxLength .~ (fromIntegral <$> colMaxLen col)
        & type_ .~ toSwaggerType (colType col)
        & items .~ (SwaggerItemsObject <$> makePropertyItems (colType col))

makeProcSchema :: Routine -> Schema
makeProcSchema pd =
  (mempty :: Schema)
    & description .~ pdDescription pd
    & type_ ?~ SwaggerObject
    & properties .~ fromList (fmap makeProcProperty (pdParams pd))
    & required .~ fmap ppName (filter ppReq (pdParams pd))

makeProcProperty :: RoutineParam -> (Text, Referenced Schema)
makeProcProperty (RoutineParam n t _ _ _) = (n, Inline s)
  where
    s =
      (mempty :: Schema)
        & type_ .~ toSwaggerType t
        & items .~ (SwaggerItemsObject <$> makePropertyItems t)
        & format .~ toSwaggerFormat t

makePreferParam :: [Text] -> Param
makePreferParam ts =
  (mempty :: Param)
    & name .~ "Prefer"
    & description ?~ "Preference"
    & required ?~ False
    & schema
      .~ ParamOther
        ( (mempty :: ParamOtherSchema)
            & in_ .~ ParamHeader
            & type_ ?~ SwaggerString
            & enum_ .~ if null enu then Nothing else JSON.decode (JSON.encode enu)
        )
  where
    enu = foldl (<>) [] (val <$> ts)
    val :: Text -> [Text]
    val = \case
      "count" -> ["count=none"]
      "return" -> ["return=representation", "return=minimal", "return=none"]
      "resolution" -> ["resolution=ignore-duplicates", "resolution=merge-duplicates"]
      _ -> []

makeProcGetParam :: RoutineParam -> Referenced Param
makeProcGetParam (RoutineParam n t _ r v) =
  Inline $
    (mempty :: Param)
      & name .~ n
      & required ?~ r
      & schema .~ ParamOther fullSchema
  where
    fullSchema = if v then schemaMulti else schemaNotMulti
    baseSchema =
      (mempty :: ParamOtherSchema)
        & in_ .~ ParamQuery
    schemaNotMulti =
      baseSchema
        & format .~ toSwaggerFormat t
        & type_ ?~ toParamType (toSwaggerType t)
    schemaMulti =
      baseSchema
        & type_ ?~ fromMaybe SwaggerString (toSwaggerType t)
        & items
          ?~ SwaggerItemsPrimitive
            (Just CollectionMulti)
            ( (mempty :: ParamSchema x)
                & type_ .~ toSwaggerTypeFromArray t
                & format .~ toSwaggerFormat (typeFromArray t)
            )
    toParamType paramType = case paramType of
      -- Array uses {} in query params
      Just SwaggerArray -> SwaggerString
      -- Type must be specified in query params
      Nothing -> SwaggerString
      _ -> fromJust paramType

makeProcGetParams :: [RoutineParam] -> [Referenced Param]
makeProcGetParams = fmap makeProcGetParam

makeProcPostParams :: Routine -> [Referenced Param]
makeProcPostParams pd =
  [ Inline $
      (mempty :: Param)
        & name .~ "args"
        & required ?~ True
        & schema .~ ParamBody (Inline $ makeProcSchema pd)
  , Ref $ Reference "preferParams"
  ]

makeParamDefs :: [Table] -> [(Text, Param)]
makeParamDefs ti =
  -- TODO: create Prefer for each method (GET, PATCH, etc.)
  [ ("preferParams", makePreferParam ["params"])
  , ("preferReturn", makePreferParam ["return"])
  , ("preferCount", makePreferParam ["count"])
  , ("preferPost", makePreferParam ["return", "resolution"])
  ,
    ( "select"
    , (mempty :: Param)
        & name .~ "select"
        & description ?~ "Filtering Columns"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamQuery
                & type_ ?~ SwaggerString
            )
    )
  ,
    ( "on_conflict"
    , (mempty :: Param)
        & name .~ "on_conflict"
        & description ?~ "On Conflict"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamQuery
                & type_ ?~ SwaggerString
            )
    )
  ,
    ( "order"
    , (mempty :: Param)
        & name .~ "order"
        & description ?~ "Ordering"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamQuery
                & type_ ?~ SwaggerString
            )
    )
  ,
    ( "range"
    , (mempty :: Param)
        & name .~ "Range"
        & description ?~ "Limiting and Pagination"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamHeader
                & type_ ?~ SwaggerString
            )
    )
  ,
    ( "rangeUnit"
    , (mempty :: Param)
        & name .~ "Range-Unit"
        & description ?~ "Limiting and Pagination"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamHeader
                & type_ ?~ SwaggerString
                & default_ .~ JSON.decode "\"items\""
            )
    )
  ,
    ( "offset"
    , (mempty :: Param)
        & name .~ "offset"
        & description ?~ "Limiting and Pagination"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamQuery
                & type_ ?~ SwaggerString
            )
    )
  ,
    ( "limit"
    , (mempty :: Param)
        & name .~ "limit"
        & description ?~ "Limiting and Pagination"
        & required ?~ False
        & schema
          .~ ParamOther
            ( (mempty :: ParamOtherSchema)
                & in_ .~ ParamQuery
                & type_ ?~ SwaggerString
            )
    )
  ]
    <> concat
      [ makeObjectBody (tableName t) : makeRowFilters (tableName t) (tableColumnsList t)
      | t <- ti
      ]

makeObjectBody :: Text -> (Text, Param)
makeObjectBody tn =
  ( "body." <> tn
  , (mempty :: Param)
      & name .~ tn
      & description ?~ tn
      & required ?~ False
      & schema .~ ParamBody (Ref (Reference tn))
  )

makeRowFilter :: Text -> Column -> (Text, Param)
makeRowFilter tn c =
  ( T.intercalate "." ["rowFilter", tn, colName c]
  , (mempty :: Param)
      & name .~ colName c
      & description .~ colDescription c
      & required ?~ False
      & schema
        .~ ParamOther
          ( (mempty :: ParamOtherSchema)
              & in_ .~ ParamQuery
              & type_ ?~ SwaggerString
          )
  )

makeRowFilters :: Text -> [Column] -> [(Text, Param)]
makeRowFilters tn = fmap (makeRowFilter tn)

makePathItem :: Table -> (FilePath, PathItem)
makePathItem t = ("/" ++ T.unpack tn, p $ tableInsertable t || tableUpdatable t || tableDeletable t)
  where
    -- Use first line of table description as summary; rest as description (if present)
    -- We strip leading newlines from description so that users can include a blank line between summary and description
    (tSum, tDesc) =
      fmap fst &&& fmap (T.dropWhile (== '\n') . snd) $
        T.breakOn "\n" <$> tableDescription t
    tOp =
      (mempty :: Operation)
        & tags .~ Set.fromList [tn]
        & summary .~ tSum
        & description .~ mfilter (/= "") tDesc
    getOp =
      tOp
        & parameters .~ fmap ref (rs <> ["select", "order", "range", "rangeUnit", "offset", "limit", "preferCount"])
        & at 206 ?~ "Partial Content"
        & at 200
          ?~ Inline
            ( (mempty :: Response)
                & description .~ "OK"
                & schema
                  ?~ Inline
                    ( mempty
                        & type_ ?~ SwaggerArray
                        & items ?~ SwaggerItemsObject (Ref $ Reference $ tableName t)
                    )
            )
    postOp =
      tOp
        & parameters .~ fmap ref ["body." <> tn, "select", "preferPost"]
        & at 201 ?~ "Created"
    patchOp =
      tOp
        & parameters .~ fmap ref (rs <> ["body." <> tn, "preferReturn"])
        & at 204 ?~ "No Content"
    deletOp =
      tOp
        & parameters .~ fmap ref (rs <> ["preferReturn"])
        & at 204 ?~ "No Content"
    pr = (mempty :: PathItem) & get ?~ getOp
    pw = pr & post ?~ postOp & patch ?~ patchOp & delete ?~ deletOp
    p False = pr
    p True = pw
    tn = tableName t
    rs = [T.intercalate "." ["rowFilter", tn, colName c] | c <- tableColumnsList t]
    ref = Ref . Reference

makeProcPathItem :: Routine -> (FilePath, PathItem)
makeProcPathItem pd = ("/rpc/" ++ toS (pdName pd), pe)
  where
    -- Use first line of proc description as summary; rest as description (if present)
    -- We strip leading newlines from description so that users can include a blank line between summary and description
    (pSum, pDesc) =
      fmap fst &&& fmap (T.dropWhile (== '\n') . snd) $
        T.breakOn "\n" <$> pdDescription pd
    procOp =
      (mempty :: Operation)
        & summary .~ pSum
        & description .~ mfilter (/= "") pDesc
        & tags .~ Set.fromList ["(rpc) " <> pdName pd]
        & produces ?~ makeMimeList [MTApplicationJSON, MTVndSingularJSON True, MTVndSingularJSON False]
        & at 200 ?~ "OK"
    getOp =
      procOp
        & parameters .~ makeProcGetParams (pdParams pd)
    postOp =
      procOp
        & parameters .~ makeProcPostParams pd
    pe = case pdVolatility pd of
      Volatile -> (mempty :: PathItem) & post ?~ postOp
      _ -> (mempty :: PathItem) & get ?~ getOp & post ?~ postOp

makeRootPathItem :: (FilePath, PathItem)
makeRootPathItem = ("/", p)
  where
    getOp =
      (mempty :: Operation)
        & tags .~ Set.fromList ["Introspection"]
        & summary ?~ "OpenAPI description (this document)"
        & produces ?~ makeMimeList [MTOpenAPI, MTApplicationJSON]
        & at 200 ?~ "OK"
    pr = (mempty :: PathItem) & get ?~ getOp
    p = pr

makePathItems :: [Routine] -> [Table] -> InsOrdHashMap FilePath PathItem
makePathItems pds ti =
  fromList $
    makeRootPathItem
      : fmap makePathItem ti
      ++ fmap makeProcPathItem pds

makeSecurityDefinitions :: Text -> Bool -> SecurityDefinitions
makeSecurityDefinitions secName allow
  | allow = SecurityDefinitions (fromList [(secName, SecurityScheme secSchType secSchDescription)])
  | otherwise = mempty
  where
    secSchType = SecuritySchemeApiKey (ApiKeyParams "Authorization" ApiKeyHeader)
    secSchDescription = Just "Add the token prepending \"Bearer \" (without quotes) to it"

postgrestSpec :: (Text, Text) -> RelationshipsMap -> [Routine] -> [Table] -> (Text, Text, Integer, Text) -> Maybe Text -> Bool -> Swagger
postgrestSpec (prettyVersion, docsVersion) rels pds ti (s, h, p, b) sd allowSecurityDef =
  (mempty :: Swagger)
    & basePath ?~ T.unpack b
    & schemes ?~ [s']
    & info
      .~ ( (mempty :: Info)
             & version .~ prettyVersion
             & title .~ fromMaybe "PostgREST API" dTitle
             & description ?~ fromMaybe "This is a dynamic API generated by PostgREST" dDesc
         )
    & externalDocs
      ?~ ( (mempty :: ExternalDocs)
             & description ?~ "PostgREST Documentation"
             & url .~ URL ("https://postgrest.org/en/" <> docsVersion <> "/references/api.html")
         )
    & host .~ h'
    & definitions .~ fromList (makeTableDef rels <$> ti)
    & parameters .~ fromList (makeParamDefs ti)
    & paths .~ makePathItems pds ti
    & produces .~ makeMimeList [MTApplicationJSON, MTVndSingularJSON True, MTVndSingularJSON False, MTTextCSV]
    & consumes .~ makeMimeList [MTApplicationJSON, MTVndSingularJSON True, MTVndSingularJSON False, MTTextCSV]
    & securityDefinitions .~ makeSecurityDefinitions securityDefName allowSecurityDef
    & security .~ [SecurityRequirement (fromList [(securityDefName, [])]) | allowSecurityDef]
  where
    s' = if s == "http" then Http else Https
    h' = Just $ Host (T.unpack $ escapeHostName h) (Just (fromInteger p))
    securityDefName = "JWT"
    (dTitle, dDesc) =
      fmap fst &&& fmap (T.dropWhile (== '\n') . snd) $
        T.breakOn "\n" <$> sd

pickProxy :: Maybe Text -> Maybe Proxy
pickProxy proxy
  | isNothing proxy = Nothing
  -- should never happen
  -- since the request would have been rejected by the middleware if proxy uri
  -- is malformed
  | isMalformedProxyUri $ fromMaybe mempty proxy = Nothing
  | otherwise =
      Just
        Proxy
          { proxyScheme = scheme
          , proxyHost = host'
          , proxyPort = port''
          , proxyPath = path'
          }
  where
    uri = toURI $ fromJust proxy
    scheme = T.init $ T.toLower $ T.pack $ uriScheme uri
    path URI{uriPath = ""} = "/"
    path URI{uriPath = p} = p
    path' = T.pack $ path uri
    authority = fromJust $ uriAuthority uri
    host' = T.pack $ uriRegName authority
    port' = uriPort authority
    readPort = fromMaybe 80 . readMaybe
    port'' :: Integer
    port'' = case (port', scheme) of
      ("", "http") -> 80
      ("", "https") -> 443
      _ -> readPort $ T.unpack $ T.tail $ T.pack port'

proxyUri :: AppConfig -> (Text, Text, Integer, Text)
proxyUri AppConfig{..} =
  case pickProxy $ toS <$> configOpenApiServerProxyUri of
    Just Proxy{..} ->
      (proxyScheme, proxyHost, proxyPort, proxyPath)
    Nothing ->
      ("http", configServerHost, toInteger configServerPort, "/")
