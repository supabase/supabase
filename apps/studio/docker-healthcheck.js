const http = require('http');
const { exec } = require('child_process');

exec('hostname -I', (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        process.exit(1);
      }
         const containerIP = stdout.trim();
        const options = {
          hostname: containerIP,
          port: 3000,
          path: '/api/profile',
          method: 'GET',
          timeout: 2000,
        };

        const req = http.request(options, (res) => {
          if (res.statusCode === 200) {
            process.exit(0);
          } else {
            process.exit(1);
          }
        });

        req.on('error', (err) => {
          console.error('Health check failed:', err);
          process.exit(1);
        });

        req.end();
});
