const os = require('os');
const crypto = require('crypto');

os.setPriority(os.constants.priority.PRIORITY_LOW);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', () => {
    const job = JSON.parse(input);
    const key = crypto.pbkdf2Sync(Buffer.from(job.pass, 'base64'), Buffer.from(job.salt, 'base64'), job.iterations, 32, 'sha256');
    process.stdout.write(key.toString('hex'));
});
