# REQUIRED TEMPLATE VARIABLES
# ------------------------------------------------------------------------------
# BASE_DOMAIN
#  - This would be the domain of your site - e.g. example.com
# 
# SUPABASE_SUBDOMAIN
# - This would be the subdomain of your site where you want to access the supabase stack - e.g. For data.example.com, this value would be 'data'
# - You should NOT provide the dot at the end of the subdomain
# 
# DOMAIN_CERT_PREFIX
# - This is the prefix applied to the filename of SSL certs and keys
# - e.g. cloudflare for example.com would use the files `cloudflare.example.com.cert.pem` and `cloudflare.example.com.key.pem`
# - YOU MUST INCLUDE THE . AFTER THE PREFIX IF USING THIS OPTION AS IT IS NOT ADDED AUTOMATICALLY
# 
# KONG_URL
# - This is the URL of your Kong instance
# - Default is usually supabase-kong but the value should not be hard-coded into this file and MUST be passed in as an argument
# 
# KONG_PORT
# - This is the port of your Kong instance
# - Default is usually 8000 but the value should not be hard-coded into this file and MUST be passed in as an argument
# 
# NGINX_USE_SSL
# - This is a boolean value that determines whether or not to use SSL
# - The default is false but the value should not be hard-coded into this file and MUST be passed in as an argument
# - It is *strongly* recommended that you use SSL when hosting on the web

server {
	listen ${NGINX_USE_SSL ? "443 ssl" : "80"};
	server_name ${SUPABASE_SUBDOMAIN}.${BASE_DOMAIN};
	${NGINX_USE_SSL ? "ssl_certificate ssl/${DOMAIN_CERT_PREFIX}${BASE_DOMAIN}.cert.pem;" : ""}
	${NGINX_USE_SSL ? "ssl_certificate_key ssl/${DOMAIN_CERT_PREFIX}${BASE_DOMAIN}.key.pem;" : ""}

	# REST
	location ~ ^/rest/v1/(.*)$ {
					proxy_set_header Host $host;
					proxy_pass http://${KONG_URL}:${KONG_PORT};
					proxy_redirect off;
	}

	# AUTH
	location ~ ^/auth/v1/(.*)$ {
					proxy_set_header Host $host;
					proxy_pass http://${KONG_URL}:${KONG_PORT};
					proxy_redirect off;
	}

	# REALTIME
	location ~ ^/realtime/v1/(.*)$ {
					proxy_redirect off;
					proxy_pass http://${KONG_URL}:${KONG_PORT};
					proxy_http_version 1.1;
					proxy_set_header Upgrade $http_upgrade;
					proxy_set_header Connection $connection_upgrade;
					proxy_set_header Host $host;
	}

	# PG META - USED BY STUDIO
	location ~ ^/pg-meta/(.*)$ {
					proxy_set_header host $host;
					proxy_pass http://${KONG_URL}:${KONG_PORT};
					proxy_redirect off;
	}

	location ~ ^/storage/v1/(.*)$ {
					proxy_set_header Host $host;
					proxy_pass http://${KONG_URL}:${KONG_PORT};
					proxy_redirect off;
	}
}