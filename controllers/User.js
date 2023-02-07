const DBConnection = require("../helpers/MySQLConnection");
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

module.exports = {
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body
      
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      const {
        base32: base32OtpSecret
      } = speakeasy.generateSecret({length: 20});

      const user = {
        name,
        email,
        password: hashedPassword,
        otp_secret: base32OtpSecret
      };
      const queryResult = await new Promise((resolve, reject) => {
        DBConnection.query(`
        INSERT INTO user SET ?`, 
        user, 
        (error, results) => {
          if (error) return reject(error);
          return resolve(results);
        });
      });
      const {
        insertId
      } = queryResult;

      return res.send({ user: { id: insertId} });
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  }
}
