const DBConnection = require("../helpers/MySQLConnection");
const speakeasy = require('speakeasy');
const moment = require('moment');

module.exports = {
  generateToken: async (req, res, next) => {
    try {
      const userId = req.query.cliente;

      const user = await new Promise((resolve, reject) => {
        DBConnection.query(`
        SELECT * FROM user WHERE user.id = ?`, 
        [userId], 
        (error, results) => {
          if (error) return reject(error);
          return resolve(results);
        });
      });
      if(Array.isArray(user) && user.length){
        const {
          otp_secret: otpSecret,
          id: clientId
        } = user[0];

        const token = speakeasy.totp({
          secret: otpSecret,
          encoding: 'base32'
        });
        const userOtp = {
          otp_code: token,
          user_id: clientId
        };

        const otpRow = await new Promise((resolve, reject) => {
          DBConnection.query(`
          SELECT * FROM user_otp WHERE otp_code = ? AND user_id = ?`, 
          [token, userId], 
          (error, results) => {
            if (error) return reject(error);
            return resolve(results);
          });
        });
        if(Array.isArray(otpRow) && otpRow.length){
          const {
            create_datetime
          } = otpRow[0];
          const stepTime = 30;
          const now = moment() // -0500
          const tokenDate = moment.utc(create_datetime).valueOf();
          const nowSeconds = now.valueOf()/1000;
          const tokenSeconds = tokenDate.valueOf()/1000;
          const remainTime = stepTime - Math.floor(nowSeconds - tokenSeconds);
          
          return res.send({ user: { token, remains: remainTime} });
        }

        const updatedd = await new Promise((resolve, reject) => {
          DBConnection.query(`
          UPDATE user_otp SET expired = TRUE
          WHERE user_id = ?
          ORDER BY create_datetime DESC
          LIMIT 1`,
          [clientId],
          (error, results) => {
            if (error) return reject(error);
            return resolve(results);
          });
        });

        console.log("sdsd", updatedd);

        await new Promise((resolve, reject) => {
          DBConnection.query(`
          INSERT INTO user_otp SET ?`,
          userOtp,
          (error, results) => {
            if (error) return reject(error);
            return resolve(results);
          });
        });
        return res.send({ user: { token, remains: 30 } });
      }
      return res.send({ user: { token: null, remains: null } });
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  },
  useToken: async (req, res, next) => {
    try {
      const userId = req.query.cliente;
      const userToken = req.query.token;

      const user = await new Promise((resolve, reject) => {
        DBConnection.query(`
        SELECT * FROM user WHERE user.id = ?`, 
        [userId], 
        (error, results) => {
          if (error) return reject(error);
          return resolve(results);
        });
      });
      
      if(Array.isArray(user) && user.length){
        const {
          otp_secret: otpSecret,
          id: clientId
        } = user[0];

        const verified = speakeasy.totp.verifyDelta({ 
          secret: otpSecret,
          encoding: 'base32',
          token: userToken,
          window: 2,
        });
        await new Promise((resolve, reject) => {
          DBConnection.query(`
          UPDATE user_otp SET used = ? WHERE user_id = ? AND otp_code = ?`,
          [Boolean(verified), clientId, userToken],
          (error, results) => {
            if (error) return reject(error);
            return resolve(results);
          });
        });
        return res.send({ user: { authenticated: Boolean(verified) } });
      }
      return res.send({ user: { authenticated: false } });
    } catch (error) {
      if (error.isJoi === true) error.status = 422
      next(error)
    }
  }
}
