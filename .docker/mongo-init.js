db = db.getSiblingDB('app');

db.createUser({
  user: 'local',
  pwd: 'local',
  roles: [
    {
      role: 'readWrite',
      db: 'app'
    }
  ]
});