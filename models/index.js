// models/index.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite3' ,
    logging: console.log,
});


module.exports = sequelize;