// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { readAll } from "https://deno.land/std/io/read_all.ts";

const postmarkEndpoint = 'https://api.postmarkapp.com/email';

// Email Subjects
const subjects = {
  en: {
    signup: 'Confirm Your Email',
    recovery: 'Reset Your Password',
    invite: 'You have been invited',
    magic_link: 'Your Magic Link',
    email_change: 'Confirm Email Change',
    email_change_new: 'Confirm New Email Address',
    reauthentication: 'Confirm Reauthentication'
  },
  es: {
    signup: 'Confirma tu correo electrónico',
    recovery: 'Restablece tu contraseña',
    invite: 'Has sido invitado',
    magic_link: 'Tu enlace mágico',
    email_change: 'Confirma el cambio de correo electrónico',
    email_change_new: 'Confirma la Nueva Dirección de Correo',
    reauthentication: 'Confirma la reautenticación'
  },
  fr: {
     signup: 'Confirmez votre adresse e-mail',
     recovery: 'Réinitialisez votre mot de passe',
     invite: 'Vous avez été invité',
     magic_link: 'Votre Lien Magique',
     email_change: 'Confirmez le changement d’adresse e-mail',
     email_change_new: 'Confirmez la nouvelle adresse e-mail',
     reauthentication: 'Confirmez la réauthentification'
   }
};

// HTML Body
const templates = {
  en: {
    signup: `<h2>Confirm your email</h2><p>Follow this link to confirm your email:</p><p><a href="{{confirmation_url}}">Confirm your email address</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    recovery: `<h2>Reset password</h2><p>Follow this link to reset the password for your user:</p><p><a href="{{confirmation_url}}">Reset password</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    invite: `<h2>You have been invited</h2><p>You have been invited to create a user on {{site_url}}. Follow this link to accept the invite:</p><p><a href="{{confirmation_url}}">Accept the invite</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    magic_link: `<h2>Magic Link</h2><p>Follow this link to login:</p><p><a href="{{confirmation_url}}">Log In</a></p><p>Alternatively, enter the code: {{token}}</p>`,
    email_change: `<h2>Confirm email address change</h2><p>Follow this link to confirm the update of your email address from {{old_email}} to {{new_email}}:</p><p><a href="{{confirmation_url}}">Change email address</a></p><p>Alternatively, enter the codes: {{token}} and {{new_token}}</p>`,
    email_change_new: `<h2>Confirm New Email Address</h2><p>Follow this link to confirm your new email address:</p><p><a href="{{confirmation_url}}">Confirm new email address</a></p><p>Alternatively, enter the code: {{new_token}}</p>`,
    reauthentication: `<h2>Confirm reauthentication</h2><p>Enter the code: {{token}}</p>`
  },
  es: {
    signup: `<h2>Confirma tu correo electrónico</h2><p>Sigue este enlace para confirmar tu correo electrónico:</p><p><a href="{{confirmation_url}}">Confirma tu correo electrónico</a></p><p>Alternativamente, ingresa el código: {{token}}</p>`,
    recovery: `<h2>Restablece tu contraseña</h2><p>Sigue este enlace para restablecer la contraseña de tu usuario:</p><p><a href="{{confirmation_url}}">Restablece tu contraseña</a></p><p>Alternativamente, ingresa el código: {{token}}</p>`,
    invite: `<h2>Has sido invitado</h2><p>Has sido invitado para crear un usuario en {{site_url}}. Sigue este enlace para aceptar la invitación:</p><p><a href="{{confirmation_url}}">Aceptar la invitación</a></p><p>Alternativamente, ingresa el código: {{token}}</p>`,
    magic_link: `<h2>Tu enlace mágico</h2><p>Sigue este enlace para iniciar sesión:</p><p><a href="{{confirmation_url}}">Iniciar sesión</a></p><p>Alternativamente, ingresa el código: {{token}}</p>`,
    email_change: `<h2>Confirma el cambio de correo electrónico</h2><p>Sigue este enlace para confirmar la actualización de tu correo electrónico de {{old_email}} a {{new_email}}:</p><p><a href="{{confirmation_url}}">Cambiar correo electrónico</a></p><p>Alternativamente, ingresa los códigos: {{token}} y {{new_token}}</p>`,
    email_change_new: `<h2>Confirma la Nueva Dirección de Correo</h2><p>Sigue este enlace para confirmar tu nueva dirección de correo electrónico:</p><p><a href="{{confirmation_url}}">Confirma la nueva dirección de correo</a></p><p>Alternativamente, ingresa el código: {{new_token}}</p>`,
    reauthentication: `<h2>Confirma la reautenticación</h2><p>Ingresa el código: {{token}}</p>`
  },
  fr: {
    signup: `<h2>Confirmez votre adresse e-mail</h2><p>Suivez ce lien pour confirmer votre adresse e-mail :</p><p><a href="{{confirmation_url}}">Confirmez votre adresse e-mail</a></p><p>Vous pouvez aussi saisir le code : {{token}}</p>`,
    recovery: `<h2>Réinitialisez votre mot de passe</h2><p>Suivez ce lien pour réinitialiser votre mot de passe :</p><p><a href="{{confirmation_url}}">Réinitialisez votre mot de passe</a></p><p>Vous pouvez aussi saisir le code : {{token}}</p>`,
    invite: `<h2>Vous avez été invité</h2><p>Vous avez été invité à créer un utilisateur sur {{site_url}}. Suivez ce lien pour accepter l'invitation :</p><p><a href="{{confirmation_url}}">Acceptez l'invitation</a></p><p>Vous pouvez aussi saisir le code : {{token}}</p>`,
    magic_link: `<h2>Votre Lien Magique</h2><p>Suivez ce lien pour vous connecter :</p><p><a href="{{confirmation_url}}">Connectez-vous</a></p><p>Vous pouvez aussi saisir le code : {{token}}</p>`,
    email_change: `<h2>Confirmez le changement d’adresse e-mail</h2><p>Suivez ce lien pour confirmer la mise à jour de votre adresse e-mail de {{old_email}} à {{new_email}} :</p><p><a href="{{confirmation_url}}">Changez d’adresse e-mail</a></p><p>Vous pouvez aussi saisir les codes : {{token}} et {{new_token}}</p>`,
    email_change_new: `<h2>Confirmez la nouvelle adresse e-mail</h2><p>Suivez ce lien pour confirmer votre nouvelle adresse e-mail :</p><p><a href="{{confirmation_url}}">Confirmez la nouvelle adresse e-mail</a></p><p>Vous pouvez aussi saisir le code : {{new_token}}</p>`,
    reauthentication: `<h2>Confirmez la réauthentification</h2><p>Saisissez le code : {{token}}</p>`
  }
};

Deno.serve(async (req) => {
  const payload = await req.text();
  const serverToken = Deno.env.get("POSTMARK_SERVER_TOKEN");
  const headers = Object.fromEntries(req.headers);
  const base64_secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
  const wh = new Webhook(base64_secret);
  const { user, email_data } = wh.verify(payload, headers);

  const language = user.user_metadata && user.user_metadata.i18n || 'en';
  const subject = subjects[language][email_data.email_action_type] || 'Notification';

  let template = templates[language][email_data.email_action_type];
  let htmlBody = template.replace('{{confirmation_url}}', email_data.confirmation_url)
    .replace('{{token}}', email_data.token || '')
    .replace('{{new_token}}', email_data.new_token || '')
    .replace('{{site_url}}', email_data.site_url || '')
    .replace('{{old_email}}', email_data.email || '')
    .replace('{{new_email}}', email_data.new_email || '');

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Postmark-Server-Token': serverToken
    },
    body: JSON.stringify({
      From: "welcome@supabase.com",
      To: user.email,
      Subject: subject,
      HtmlBody: htmlBody
    })
  };

  try {
    const response = await fetch(postmarkEndpoint, requestOptions);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.Message}`);
    }
    return new Response(JSON.stringify({
      message: "Email sent successfully."
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Failed to process the request: ${error.message}`
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
