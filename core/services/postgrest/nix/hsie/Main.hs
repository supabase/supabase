{-# LANGUAGE GHC2021 #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE TypeFamilies #-}

-- | Haskell Imports and Exports tool
--
-- This tool parses imports and exports from Haskell source files and provides
-- analysis on these imports. For example, you can check whether consistent
-- import aliases are used across your codebase.
module Main (main) where

import Data.Aeson.Encode.Pretty (encodePretty)
import Data.Function ((&))
import Data.List (intercalate)
import Data.Maybe (catMaybes, mapMaybe)
import Data.Text (Text)
import GHC.Driver.Errors.Types (GhcMessage)
import GHC.Generics (Generic)
import GHC.Hs.Extension (GhcPs)
import GHC.Types.Error (Messages, defaultDiagnosticOpts, getMessages)
import GHC.Types.Name.Occurrence (occNameString)
import GHC.Types.Name.Reader (rdrNameOcc)
import GHC.Unit.Module (moduleNameString)
import GHC.Utils.Error (pprMsgEnvelopeBagWithLoc)
import GHC.Utils.Outputable (showSDocUnsafe)
import System.Directory.Recursive (getFilesRecursive)
import System.Exit (exitFailure)

import Data.Aeson qualified as JSON
import Data.ByteString.Lazy.Char8 qualified as LBS8
import Data.Csv qualified as Csv
import Data.Map qualified as Map
import Data.Set qualified as Set
import Data.Text qualified as T
import Data.Text.IO qualified as T
import Dot qualified
import GHC qualified
import GHC.Paths qualified
import Language.Haskell.GHC.ExactPrint.Parsers qualified as ExactPrint
import Options.Applicative qualified as O
import System.FilePath qualified as FP

-- TYPES

data Options
  = Options
  { command :: Command
  , sources :: [FilePath]
  }

data Command
  = Dump OutputFormat
  | GraphSymbols
  | GraphModules
  | CheckAliases
  | CheckWildcards [Text]

data OutputFormat = OutputCsv | OutputJson

data ImportedSymbol
  = ImportedSymbol
  { impFromModule :: Text
  , impModule :: Text
  , impQualified :: ImportQualified
  , impAlias :: Maybe Text
  , impType :: ImportType
  , impSymbol :: Maybe Text
  , impInternal :: ModuleInternal
  , impSource :: FilePath
  , impFile :: FilePath
  }
  deriving (Csv.DefaultOrdered, Csv.ToNamedRecord, Generic, JSON.ToJSON)

data ImportQualified
  = Qualified
  | NotQualified
  deriving (Eq, Generic, JSON.ToJSON)

instance Csv.ToField ImportQualified where
  toField Qualified = "qualified"
  toField NotQualified = "not qualified"

data ModuleInternal
  = Internal
  | External
  deriving (Eq, Generic, JSON.ToJSON)

instance Csv.ToField ModuleInternal where
  toField Internal = "internal"
  toField External = "external"

data ImportType
  = Wildcard
  | Hiding
  | Explicit
  deriving (Eq, Generic, JSON.ToJSON)

instance Csv.ToField ImportType where
  toField Wildcard = "wildcard"
  toField Hiding = "hiding"
  toField Explicit = "explicit"

-- | Mapping of modules to their aliases and to the files they are found in
type ModuleAliases = [(Text, [(Text, [FilePath])])]

-- | Mapping of modules to files
type WildcardImports = [(FilePath, [Text])]

-- MAIN

main :: IO ()
main =
  run =<< O.customExecParser prefs infoOpts
  where
    prefs = O.prefs $ O.subparserInline <> O.showHelpOnEmpty
    infoOpts =
      O.info (O.helper <*> opts) $
        O.fullDesc
          <> O.header "hsie - Swiss army knife for HaSkell Imports and Exports"
          <> O.progDesc "Parse Haskell code to analyze imports and exports"
    opts =
      Options <$> commandOption <*> O.some srcOption
    srcOption =
      O.argument O.str $
        O.metavar "SRCDIR"
          <> O.help "Haskell source directory"
          <> O.action "directory"
    commandOption =
      O.subparser $
        command
          "dump-imports"
          "Dump imported symbols as CSV or JSON"
          (Dump <$> jsonOutputFlag)
          <> command
            "graph-modules"
            "Print dot graph of module imports"
            (pure GraphModules)
          <> command
            "graph-symbols"
            "Print dot graph of symbol imports"
            (pure GraphSymbols)
          <> command
            "check-aliases"
            "Check that aliases of imported modules are consistent"
            (pure CheckAliases)
          <> command
            "check-wildcards"
            "Check that no modules are imported as unqualified wildcards"
            (CheckWildcards <$> O.many okModuleOption)
    command name desc options =
      O.command name . O.info (O.helper <*> options) $ O.progDesc desc
    jsonOutputFlag =
      O.flag OutputCsv OutputJson $
        O.long "json" <> O.short 'j' <> O.help "Output JSON"
    okModuleOption =
      O.strOption $
        O.long "ok"
          <> O.short 'o'
          <> O.metavar "OKMODULE"
          <> O.help "Module that is ok to import as unqualified wildcard"

run :: Options -> IO ()
run Options{command, sources} =
  runCommand command . markInternal . concat =<< mapM sourceSymbols sources
  where
    runCommand :: Command -> [ImportedSymbol] -> IO ()
    runCommand (Dump format) = LBS8.putStr . dump format
    runCommand GraphSymbols = T.putStr . symbolsGraph
    runCommand GraphModules = T.putStr . Dot.encode . modulesGraph
    runCommand CheckAliases = runInconsistentAliases . inconsistentAliases
    runCommand (CheckWildcards okModules) = runWildcards . wildcards okModules

    runInconsistentAliases :: ModuleAliases -> IO ()
    runInconsistentAliases [] = T.putStrLn "No inconsistent module aliases found."
    runInconsistentAliases xs = T.putStr (formatInconsistentAliases xs) >> exitFailure

    runWildcards :: WildcardImports -> IO ()
    runWildcards [] = T.putStrLn "No unwanted wildcard imports found."
    runWildcards xs = T.putStr (formatWildcards xs) >> exitFailure

-- | Mark imports from modules that are among the analyzed ones as internal.
markInternal :: [ImportedSymbol] -> [ImportedSymbol]
markInternal symbols =
  fmap mark symbols
  where
    mark s = s{impInternal = if isInternal s then Internal else External}
    isInternal = flip Set.member internalModules . impModule
    internalModules = Set.fromList $ fmap impFromModule symbols

-- SYMBOLS

-- | Parse all imported symbols from a source of Haskell source files
sourceSymbols :: FilePath -> IO [ImportedSymbol]
sourceSymbols source = do
  files <- filterExts [".hs", ".imports"] <$> getFilesRecursive source
  concat <$> mapM moduleSymbols files
  where
    filterExts exts = filter $ flip elem exts . FP.takeExtension
    moduleSymbols filepath = do
      GHC.HsModule{..} <- parseModule filepath
      return $ concatMap (importSymbols source filepath . GHC.unLoc) hsmodImports

-- | Parse a Haskell module
parseModule :: FilePath -> IO (GHC.HsModule GhcPs)
parseModule filepath = do
  result <- ExactPrint.parseModule GHC.Paths.libdir filepath
  case result of
    Right hsmod ->
      return $ GHC.unLoc hsmod
    Left errs ->
      fail $
        "Errors with "
          <> show filepath
          <> ":\n    "
          <> formatParseErrors errs

formatParseErrors :: Messages GhcMessage -> String
formatParseErrors errs =
  intercalate "\n    "
    . fmap showSDocUnsafe
    $ pprMsgEnvelopeBagWithLoc (defaultDiagnosticOpts @GhcMessage) (getMessages errs)

-- | Symbols imported in an import declaration.
--
-- If the import is a wildcard, i.e. no symbols are selected for import, then
-- only one item is returned.
importSymbols :: FilePath -> FilePath -> GHC.ImportDecl GhcPs -> [ImportedSymbol]
importSymbols source filepath GHC.ImportDecl{..} =
  case ideclImportList of
    Just (importListInterpretation, syms) ->
      symbol (if importListInterpretation == GHC.EverythingBut then Hiding else Explicit)
        . Just
        . GHC.unLoc
        <$> GHC.unLoc syms
    Nothing ->
      [symbol Wildcard Nothing]
  where
    symbol hiding sym =
      ImportedSymbol
        { impFile = relativePath filepath
        , impSource = source
        , impFromModule = T.pack $ moduleFromPath filepath
        , impModule = T.pack . moduleNameString . GHC.unLoc $ ideclName
        , impQualified = if ideclQualified /= GHC.NotQualified then Qualified else NotQualified
        , impAlias = T.pack . moduleNameString . GHC.unLoc <$> ideclAs
        , impInternal = External
        , impType = hiding
        , impSymbol = T.pack . occNameString . rdrNameOcc . GHC.ieName <$> sym
        }
    moduleFromPath =
      intercalate "." . FP.splitDirectories . FP.dropExtension . relativePath
    relativePath = FP.makeRelative source

-- DUMP

-- | Dump list of symbols as CSV or JSON
dump :: OutputFormat -> [ImportedSymbol] -> LBS8.ByteString
dump OutputCsv = Csv.encodeDefaultOrderedByName
dump OutputJson = encodePretty

-- ALIASES

-- | Find modules that are imported under different aliases
inconsistentAliases :: [ImportedSymbol] -> ModuleAliases
inconsistentAliases symbols =
  foldr (insertSetMapMap . moduleAlias) Map.empty symbols
    & Map.map (aliases . Map.toList)
    & Map.filter ((<) 1 . length)
    & Map.toList
  where
    moduleAlias ImportedSymbol{..} =
      (impModule, impAlias, FP.joinPath [impSource, impFile])
    insertSetMapMap (k1, k2, v) =
      Map.insertWith
        (Map.unionWith Set.union)
        k1
        (Map.singleton k2 $ Set.singleton v)
    aliases :: [(Maybe Text, Set.Set FilePath)] -> [(Text, [FilePath])]
    aliases = mapMaybe (\(k, v) -> fmap (,Set.toList v) k)

formatInconsistentAliases :: ModuleAliases -> Text
formatInconsistentAliases modules =
  "The following imports have inconsistent aliases:\n\n"
    <> T.concat (fmap formatModule modules)
  where
    formatModule (modName, aliases) =
      "Module '"
        <> modName
        <> "' has the aliases:\n"
        <> T.concat (fmap formatAlias aliases)
        <> "\n"
    formatAlias (alias, sourceFiles) =
      "  '"
        <> alias
        <> "' in file"
        <> (if length sourceFiles > 2 then "s" else "")
        <> ":\n"
        <> T.concat (fmap formatFile sourceFiles)
    formatFile sourceFile =
      "    " <> T.pack sourceFile <> "\n"

-- WILDCARDS

-- | Find modules that are imported as wildcards, excluding whitelisted modules.
--
-- Wildcard imports are ones that are not qualified and do not specify which
-- symbols should be imported.
wildcards :: [Text] -> [ImportedSymbol] -> WildcardImports
wildcards okModules =
  groupByFile . filter isWildcard . filter (not . isOkModule)
  where
    isWildcard ImportedSymbol{..} =
      impQualified == NotQualified && impType /= Explicit
    isOkModule = flip Set.member (Set.fromList okModules) . impModule
    groupByFile = Map.toList . fmap Set.toList . foldr insertMap Map.empty
    insertMap ImportedSymbol{..} =
      Map.insertWith Set.union impFile (Set.singleton impModule)

formatWildcards :: WildcardImports -> Text
formatWildcards files =
  "Modules in the following files were imported as wildcards:\n\n"
    <> T.concat (fmap formatFile files)
  where
    formatFile (filepath, modules) =
      "In " <> T.pack filepath <> ":\n" <> T.concat (fmap formatModule modules) <> "\n"
    formatModule moduleName = "  " <> moduleName <> "\n"

-- GRAPHS

modulesGraph :: [ImportedSymbol] -> Dot.DotGraph
modulesGraph symbols =
  Dot.DotGraph Dot.Strict Dot.Directed (Just "Modules") $ fmap edge edges
  where
    edge (from, to) =
      Dot.StatementEdge $
        Dot.EdgeStatement
          (Dot.ListTwo (edgeNode from) (edgeNode to) mempty)
          mempty
    edgeNode t = Dot.EdgeNode $ Dot.NodeId (Dot.Id t) Nothing
    edges = unique . fmap edgeTuple . filter ((==) Internal . impInternal) $ symbols
    edgeTuple ImportedSymbol{..} = (impFromModule, impModule)
    unique = Set.toList . Set.fromList

-- Building Text directly as the Dot package currently doesn't support subgraphs.
symbolsGraph :: [ImportedSymbol] -> Text
symbolsGraph symbols =
  "digraph Symbols {\n"
    <> "  rankdir=LR\n"
    <> "  ranksep=5\n"
    <> T.concat (fmap edge edges)
    <> T.concat (fmap cluster symbolsByModule)
    <> "}\n"
  where
    edge (from, to, symbol) =
      "  "
        <> quoted from
        <> " -> "
        <> quoted (to <> maybe "" ("." <>) symbol)
        <> "\n"
    cluster (moduleName, clusterSymbols) =
      "  subgraph "
        <> quoted ("cluster_" <> moduleName)
        <> " {\n"
        <> "    "
        <> quoted moduleName
        <> "\n"
        <> T.concat (fmap (clusterNode moduleName) clusterSymbols)
        <> "  }\n"
    clusterNode moduleName symbol =
      "    " <> quoted (moduleName <> "." <> symbol) <> "\n"
    quoted t = "\"" <> t <> "\""
    edges = unique . fmap edgeTuple . filter ((==) Internal . impInternal) $ symbols
    edgeTuple ImportedSymbol{..} = (impFromModule, impModule, impSymbol)
    unique = Set.toList . Set.fromList
    symbolsByModule =
      Map.toList . Map.map (catMaybes . Set.toList) . foldr insertMap Map.empty $ edges
    insertMap (_, to, symbol) = Map.insertWith Set.union to $ Set.singleton symbol
