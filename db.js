const mysql = require('mysql2');

const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'forge_pixel'
});

db.connect(err => {
  if (err) {
    console.error('Error de conexión a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL — forge_pixel');
});

module.exports = db;
