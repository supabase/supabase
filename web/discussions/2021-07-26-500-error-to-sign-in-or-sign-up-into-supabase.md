---
title: 500 error to sign in or sign up into supabase
author: milestones95
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/47959617?v=4
author_url: https://github.com/milestones95
category: Q&A
upvoteCount: 2
commentCount: 2
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

Hi I'm not sure why it's not letting me sign in or sign up on supabase. Is anyone else hitting this issue?

Request URL: https://app.supabase.io/api/profile

Error message: {"message":"invalid json response body at https://readonly.supabase.io/rest/v1/users?select=id%2Cauth0_id%2Cprimary_email%2Cusername%2Cfirst_name%2Clast_name%2Cmobile%2Cis_alpha_user%2Corganizations%28id%2Cslug%2Cname%2Cbadge%2Cproject_limit%2Cstripe_customer_id%2Cbilling_email%2Cstripe_customer_object%2Cprojects%28id%2Cref%2Cname%2Cstatus%2Corganization_id%2Cinserted_at%2Csubscription_id%2Cdb_user_supabase%2Cdb_host%2Cdb_pass_supabase%2Cdb_ipv4%2Cdb_port%2Cdb_name%2Cdb_ssl%2Cinfrastructure_config-%3E%22cloud_provider%22%2Cinfrastructure_config-%3E%22region%22%2Cservices%28infrastructure%28app_versions%28version%29%29%29%29%29&auth0_id=eq.github%7C47959617&organizations.status=neq.REMOVED&organizations.projects.status=neq.GOING_DOWN&organizations.projects.status=neq.REMOVED&organizations.projects.services.status=neq.REMOVED&organizations.projects.services.infrastructure.status=neq.REMOVED reason: Unexpected token A in JSON at position 0","type":"invalid-json"}

---

<a href="https://github.com/supabase/supabase/discussions/2571#discussioncomment-1051729" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/72L" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/5567899?u=76ce68724f1119a7932da201f44a8032a382a435&v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">72L</span>
    <span style={{ color: '#8b949e' }}>2 months ago</span>
  </span>
  </a>
  </div>
  Yes, there's an issue filed here: https://github.com/supabase/supabase/issues/2568

~~For immediate relief, you can try using a VPN. Singapore works for me!~~ (no longer)


  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
