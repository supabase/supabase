{{/*
Expand the name of the chart.
*/}}
{{- define "supabase.kong.name" -}}
{{- default (print .Chart.Name "-kong") .Values.kong.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "supabase.kong.fullname" -}}
{{- if .Values.kong.fullnameOverride }}
{{- .Values.kong.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default (print .Chart.Name "-kong") .Values.kong.nameOverride }}
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
{{- define "supabase.kong.selectorLabels" -}}
app.kubernetes.io/name: {{ include "supabase.kong.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "supabase.kong.serviceAccountName" -}}
{{- if .Values.kong.serviceAccount.create }}
{{- default (include "supabase.kong.fullname" .) .Values.kong.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.kong.serviceAccount.name }}
{{- end }}
{{- end }}
