FROM postgres:17.5


COPY init.sh /docker-entrypoint-initdb.d/ssl-config.sh

# Copy the entrypoint script to the image
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT [ "/usr/local/bin/entrypoint.sh"]
