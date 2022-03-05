Place your SSL certificates and keys in this folder

For example, with a cloudflare-based setup, you would have the following files in this folder:

- cloudflare.example.com.cert.pem
- cloudflare.example.com.key.pem

You should ensure that the files have `.key.pem` (private key) and `.cert.pem` (certificate) at the end as demonstated above

**NEVER, EVER, EVER COMMIT YOUR CERTS OR KEYS TO SOURCE CONTROL!**

The gitignore in this repo ensures that `.pem` files are not committed automatically and you definitely should **not** change this.
