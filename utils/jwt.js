const token =require('jsonwebtoken');
require("dotenv").config();
const generateToken = (id) => {
    return token.sign({id}, process.env.JWTSECRET, {
        expiresIn: '30d'
    });
}
module.exports = generateToken; 