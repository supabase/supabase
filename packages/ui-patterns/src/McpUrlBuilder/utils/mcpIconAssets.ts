/// <reference path="../../types/assets.d.ts" />

import antigravityIcon from '../assets/antigravity-icon.svg'
import claudeIcon from '../assets/claude-icon.svg'
import copilotDarkIcon from '../assets/copilot-icon-dark.svg'
import copilotIcon from '../assets/copilot-icon.svg'
import cursorDarkIcon from '../assets/cursor-icon-dark.svg'
import cursorIcon from '../assets/cursor-icon.svg'
import factoryDarkIcon from '../assets/factory-icon-dark.svg'
import factoryIcon from '../assets/factory-icon.svg'
import geminiCliIcon from '../assets/gemini-cli-icon.svg'
import gooseDarkIcon from '../assets/goose-icon-dark.svg'
import gooseIcon from '../assets/goose-icon.svg'
import kimiDarkIcon from '../assets/kimi-icon-dark.svg'
import kimiIcon from '../assets/kimi-icon.svg'
import kiroIcon from '../assets/kiro-icon.svg'
import openaiDarkIcon from '../assets/openai-icon-dark.svg'
import openaiIcon from '../assets/openai-icon.svg'
import opencodeDarkIcon from '../assets/opencode-icon-dark.svg'
import opencodeIcon from '../assets/opencode-icon.svg'
import perplexityDarkIcon from '../assets/perplexity-icon-dark.svg'
import perplexityIcon from '../assets/perplexity-icon.svg'
import vscodeIcon from '../assets/vscode-icon.svg'
import windsurfDarkIcon from '../assets/windsurf-icon-dark.svg'
import windsurfIcon from '../assets/windsurf-icon.svg'

type ImportedAssetModule = string | { src: string }

type McpClientIconAsset = {
  light: ImportedAssetModule
  dark: ImportedAssetModule
}

const MCP_CLIENT_ICON_ASSETS = {
  antigravity: { light: antigravityIcon, dark: antigravityIcon },
  claude: { light: claudeIcon, dark: claudeIcon },
  copilot: { light: copilotIcon, dark: copilotDarkIcon },
  cursor: { light: cursorIcon, dark: cursorDarkIcon },
  factory: { light: factoryIcon, dark: factoryDarkIcon },
  'gemini-cli': { light: geminiCliIcon, dark: geminiCliIcon },
  goose: { light: gooseIcon, dark: gooseDarkIcon },
  kimi: { light: kimiIcon, dark: kimiDarkIcon },
  kiro: { light: kiroIcon, dark: kiroIcon },
  openai: { light: openaiIcon, dark: openaiDarkIcon },
  opencode: { light: opencodeIcon, dark: opencodeDarkIcon },
  perplexity: { light: perplexityIcon, dark: perplexityDarkIcon },
  vscode: { light: vscodeIcon, dark: vscodeIcon },
  windsurf: { light: windsurfIcon, dark: windsurfDarkIcon },
} satisfies Record<string, McpClientIconAsset>

export type McpClientIconName = keyof typeof MCP_CLIENT_ICON_ASSETS

function normalizeAssetUrl(asset: ImportedAssetModule): string {
  return typeof asset === 'string' ? asset : asset.src
}

export function getMcpClientIconAssetUrl(icon: string, useDarkVariant: boolean): string {
  const iconAssets = MCP_CLIENT_ICON_ASSETS[icon.toLowerCase() as McpClientIconName]
  if (!iconAssets) return ''

  return normalizeAssetUrl(useDarkVariant ? iconAssets.dark : iconAssets.light)
}
