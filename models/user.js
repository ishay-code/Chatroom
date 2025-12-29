'use strict';
const sequelize = require('./index');
const { DataTypes } = require('sequelize');
const Message = require('./message');
const bcrypt = require('bcrypt');

const User = sequelize.define(
    'User',
    {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlpha: true,
                len: [3, 32],
            },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlpha: true,
                len: [3, 32],
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,

                async isEmailExist() {
                    return await User.findOne({
                        where: {
                            email: this.email,
                        },
                    }).then((user) => {
                        if (user) {
                            throw new Error('Email already exists');
                        }
                    });
                }
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        hooks: {
            beforeCreate: async (user, options) => {
                const saltRounds = 10;
                user.password = await bcrypt.hash(user.password, saltRounds);
            },
        },
        modelName: 'User', // Model name for Sequelize
    }
);
User.hasMany(Message, {

    foreignKey: 'user_id'
});

Message.belongsTo(User, {

    foreignKey: 'user_id'
});

module.exports = { User, Message };

