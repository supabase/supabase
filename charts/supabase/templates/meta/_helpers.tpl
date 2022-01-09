{{/*
Expand the name of the chart.
*/}}
{{- define "supabase.meta.name" -}}
{{- default (print .Chart.Name "-meta") .Values.meta.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "supabase.meta.fullname" -}}
{{- if .Values.meta.fullnameOverride }}
{{- .Values.meta.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default (print .Chart.Name "-meta") .Values.meta.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "supabase.meta.selectorLabels" -}}
app.kubernetes.io/name: {{ include "supabase.meta.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "supabase.meta.serviceAccountName" -}}
{{- if .Values.meta.serviceAccount.create }}
{{- default (include "supabase.meta.fullname" .) .Values.meta.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.meta.serviceAccount.name }}
{{- end }}
{{- end }}
