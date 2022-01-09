{{/*
Expand the name of the chart.
*/}}
{{- define "supabase.storage.name" -}}
{{- default (print .Chart.Name "-storage") .Values.storage.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "supabase.storage.fullname" -}}
{{- if .Values.storage.fullnameOverride }}
{{- .Values.storage.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default (print .Chart.Name "-storage") .Values.storage.nameOverride }}
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
{{- define "supabase.storage.selectorLabels" -}}
app.kubernetes.io/name: {{ include "supabase.storage.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "supabase.storage.serviceAccountName" -}}
{{- if .Values.storage.serviceAccount.create }}
{{- default (include "supabase.storage.fullname" .) .Values.storage.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.storage.serviceAccount.name }}
{{- end }}
{{- end }}
