const Sequelize = require('sequelize');

const { Op } = Sequelize;
const db = require('../../models');
const user = db.user;

const usersLogin = [
    {
        id:1,
        first_name:"admin",
        last_name:"user",
        email:"admin@urlane.com",
        phone_number:"123456789",
        password:"$2a$08$PMvfOIsD4OWysOd0gigGmeowO2EpvYVqxeQZj1Px6rmVW0Tppzela",
        is_email_verified:1,
        is_phone_verified:1
    },
    {
        id:1,
        first_name:"test",
        last_name:"user",
        email:"testuser@urlane.com",
        phone_number:"123456789",
        password:"$2a$08$PMvfOIsD4OWysOd0gigGmeowO2EpvYVqxeQZj1Px6rmVW0Tppzela",
        is_email_verified:1,
        is_phone_verified:1
    }
]

const seed = () =>{
    return user.bulkCreate(usersLogin);
}

seed()
.then(() => {
    process.exit();
});