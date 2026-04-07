# 🔥 TI-LEX-AL — Plateforme IA Officielle (v7)

## Structure
```
ti-lex-al-final/
├── vercel.json          # Config Vercel
├── package.json         # Dépendances (openai)
├── .gitignore           # Fichiers à ignorer
├── README.md            # Ce fichier
├── public/
│   └── index.html       # Frontend complet (v7 corrigé)
└── api/
    ├── chat.js          # Serverless GPT-4o-mini
    └── search.js        # Proxy Tavily sécurisé
```

## Déploiement Vercel

1. Push sur GitHub
2. Importe dans Vercel
3. Ajoute la variable : `OPENAI_API_KEY` = ta clé OpenAI
4. Optionnel : `TAVILY_API_KEY` = ta clé Tavily
5. Deploy!

## Corrections v6 → v7
- XSS corrigé (sanitization)
- Clé API Tavily retirée du frontend
- ID dupliqué agentView corrigé
- Navigation et agents fixés
- Scroll typewriter robuste
- Validation email ajoutée
- Résultats de recherche injectés dans le contexte GPT
- Nom officiel TI-LEX-AL partout
