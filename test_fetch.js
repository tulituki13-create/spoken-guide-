fetch('http://localhost:3000/api/auth/admin/users', {
  headers: { 'admin-secret': 'admin123' }
}).then(res => res.json()).then(console.log).catch(console.error);
