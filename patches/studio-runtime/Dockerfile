FROM supabase/studio:2026.03.16-sha-5528817

COPY chunks/0a99685b5d0b5855.js /app/apps/studio/.next/static/chunks/0a99685b5d0b5855.js
COPY chunks/d0dc3f0f47aec260.js /app/apps/studio/.next/static/chunks/d0dc3f0f47aec260.js
COPY chunks/78214f3a2a0e7632.js /app/apps/studio/.next/static/chunks/78214f3a2a0e7632.js
COPY chunks/225984e12ec6f387.js /app/apps/studio/.next/static/chunks/225984e12ec6f387.js
COPY proxy-server.js /app/proxy-server.js

CMD ["node", "/app/proxy-server.js"]
