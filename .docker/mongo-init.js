db = db.getSiblingDB('eiffage-dev');

db.createUser({
  user: 'local',
  pwd: 'local',
  roles: [
    {
      role: 'readWrite',
      db: 'eiffage-dev'
    }
  ]
});