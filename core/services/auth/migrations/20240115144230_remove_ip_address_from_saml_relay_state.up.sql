do $$
begin
   if exists (select from information_schema.columns where table_schema = '{{ index .Options "Namespace" }}' and table_name = 'saml_relay_states' and column_name = 'from_ip_address') then
      alter table {{ index .Options "Namespace" }}.saml_relay_states drop column from_ip_address;
   end if;
end
$$;
