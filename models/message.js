'use strict';
const sequelize = require('./index');
const { DataTypes } = require('sequelize');
const Message = sequelize.define(
    'Message',
    {
        text: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 500]
            },
        },
        user_id:{ //who sent the message
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        modelName: 'Message',
    }
);

module.exports =  Message ;

