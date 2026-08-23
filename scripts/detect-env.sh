#!/usr/bin/env bash
# =============================================================
# detect-env.sh — اكتشاف البيئة تلقائياً وتحميل المتغيرات
# الاستخدام: source scripts/detect-env.sh
#             أو: source scripts/detect-env.sh --load
# =============================================================

set -euo pipefail

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_DIR="$PROJECT_ROOT/environments"

# =====================================================
# دالة الاكتشاف التلقائي للبيئة
# =====================================================
detect_environment() {
  local detected_env=""

  # 1. إذا كان المتغير محدداً مسبقاً
  if [[ -n "${KIRO_ENV:-}" ]]; then
    echo "$KIRO_ENV"
    return
  fi

  # 2. كشف WSL
  if grep -qi "microsoft" /proc/version 2>/dev/null || \
     grep -qi "wsl" /proc/version 2>/dev/null; then
    detected_env="wsl-local"
    echo "$detected_env"
    return
  fi

  # 3. كشف AWS EC2 عبر instance metadata (IMDSv2)
  local aws_token
  aws_token=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 5" \
    --connect-timeout 1 2>/dev/null || echo "")
  if [[ -n "$aws_token" ]]; then
    local aws_check
    aws_check=$(curl -s -H "X-aws-ec2-metadata-token: $aws_token" \
      "http://169.254.169.254/latest/meta-data/instance-id" \
      --connect-timeout 1 2>/dev/null || echo "")
    if [[ "$aws_check" =~ ^i- ]]; then
      detected_env="aws-cloud"
      echo "$detected_env"
      return
    fi
  fi

  # 4. كشف Azure VM عبر instance metadata
  local azure_check
  azure_check=$(curl -s -H "Metadata:true" \
    "http://169.254.169.254/metadata/instance?api-version=2021-02-01" \
    --connect-timeout 1 2>/dev/null || echo "")
  if echo "$azure_check" | grep -q '"azEnvironment"'; then
    # فرّق بين Azure VM (IaaS) و Azure Cloud (PaaS)
    if echo "$azure_check" | grep -q '"vmId"'; then
      detected_env="vm-azure"
    else
      detected_env="azure-cloud"
    fi
    echo "$detected_env"
    return
  fi

  # 5. كشف OCI عبر instance metadata
  local oci_check
  oci_check=$(curl -s \
    "http://169.254.169.254/opc/v2/instance/" \
    -H "Authorization: Bearer Oracle" \
    --connect-timeout 1 2>/dev/null || echo "")
  if echo "$oci_check" | grep -q '"compartmentId"'; then
    detected_env="vm-oci"
    echo "$detected_env"
    return
  fi

  # 6. كشف Windows عبر متغير OS
  if [[ "${OS:-}" == "Windows_NT" ]]; then
    detected_env="windows-local"
    echo "$detected_env"
    return
  fi

  # 7. افتراضي: Linux محلي — نتعامل كـ WSL
  detected_env="wsl-local"
  echo "$detected_env"
}

# =====================================================
# دالة تحميل ملف البيئة
# =====================================================
load_env_file() {
  local env_name="$1"
  local env_file="$ENV_DIR/.env.${env_name}"
  local example_file="${env_file}.example"

  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$env_file"
    set +a
    echo -e "${GREEN}✅ تم تحميل:${NC} $env_file"
  elif [[ -f "$example_file" ]]; then
    echo -e "${YELLOW}⚠️  ملف البيئة غير موجود:${NC} $env_file"
    echo -e "${CYAN}   نسخ القالب...${NC}"
    cp "$example_file" "$env_file"
    echo -e "${YELLOW}   تم إنشاء: $env_file${NC}"
    echo -e "${RED}   يرجى تعديل القيم الحقيقية قبل المتابعة!${NC}"
    set -a
    source "$env_file"
    set +a
  else
    echo -e "${RED}❌ لم يُعثر على ملف البيئة:${NC} $env_file"
    echo -e "   أو القالب: $example_file"
    return 1
  fi
}

# =====================================================
# دالة التحقق من المتغيرات المطلوبة
# =====================================================
validate_env() {
  local required_vars=(
    "KIRO_ENV"
    "WORKSPACE_ROOT"
    "DB_CONNECTION_STRING"
    "SUPABASE_URL"
    "SUPABASE_ACCESS_TOKEN"
    "GITHUB_TOKEN"
    "GIT_AUTHOR_NAME"
    "GIT_AUTHOR_EMAIL"
  )

  local missing=()
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing+=("$var")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo -e "${RED}❌ متغيرات مفقودة:${NC}"
    for var in "${missing[@]}"; do
      echo -e "   - ${YELLOW}$var${NC}"
    done
    return 1
  fi

  echo -e "${GREEN}✅ جميع المتغيرات المطلوبة موجودة${NC}"
}

# =====================================================
# دالة طباعة ملخص البيئة
# =====================================================
print_summary() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║       معلومات البيئة الحالية             ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
  echo -e "  ${CYAN}البيئة:${NC}        ${KIRO_ENV:-غير محدد}"
  echo -e "  ${CYAN}المشروع:${NC}       ${WORKSPACE_ROOT:-غير محدد}"
  echo -e "  ${CYAN}Supabase URL:${NC}  ${SUPABASE_URL:-غير محدد}"
  echo -e "  ${CYAN}DB Host:${NC}       $(echo "${DB_CONNECTION_STRING:-غير محدد}" | grep -oP '(?<=@)[^:]+' || echo 'غير محدد')"
  echo -e "  ${CYAN}AWS MCP:${NC}       $([ "${AWS_MCP_DISABLED:-true}" = "true" ] && echo '❌ معطل' || echo '✅ مفعّل')"
  echo -e "  ${CYAN}Azure MCP:${NC}     $([ "${AZURE_MCP_DISABLED:-true}" = "true" ] && echo '❌ معطل' || echo '✅ مفعّل')"
  echo ""
}

# =====================================================
# تنفيذ الاكتشاف والتحميل
# =====================================================
main() {
  echo -e "${BLUE}🔍 جاري اكتشاف البيئة...${NC}"

  local detected
  detected=$(detect_environment)

  echo -e "${GREEN}✅ البيئة المكتشفة:${NC} ${YELLOW}${detected}${NC}"

  # تحميل ملف البيئة المناسب
  load_env_file "$detected"

  # التأكد من تعيين KIRO_ENV
  export KIRO_ENV="$detected"

  # التحقق من المتغيرات
  validate_env

  # طباعة الملخص
  print_summary

  # تصدير المتغير للـ shell الأب (عند استخدام source)
  echo -e "${GREEN}✅ جاهز للعمل على بيئة:${NC} ${CYAN}${KIRO_ENV}${NC}"
}

main "$@"
