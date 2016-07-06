/**
 * Created by hanwencheng on 7/4/16.
 */
import DB from '../../lib/db-interface.js';
import {logger} from '../../lib/logger'
import uuid from 'node-uuid'
import uuidCheck from 'uuid-validate'
var config = require('../../lib/config');
const async = require('async')

export default function create(req, params) {


  logger.debug('get request in createToken.js with params: ', params)

  const LackParameterError = config.errors.LackParameterError
  const WrongRequestError = config.errors.WrongRequestError

  /**
   * req.body
   * {
   *  name : name,
   *  password: password
   * }
   */
  return new Promise((resolve, reject)=>{

    const steps = [
      validateParams,
      saveToken,
    ]

    function validateParams(callback){
      if(params.length < 1){
        return callback(null, false)
      }else if(params.length === 1){
        if(!uuidCheck(params[0])){
          return callback(null, false)
        }else
          checkToken(params[0], callback)
      }else{
        callback(WrongRequestError)
      }
    }

    function saveToken(validToken,callback){
      if(validToken){
        callback(null, validToken.data)
      }else{
        var newToken = uuid.v1();
        DB.save('token', {uuid : newToken}, function(result){
          logger.trace('successful create token in database: ', result.data)
          callback(null, result.data)
        },function(err){
          callback(err)
        })
      }
    }

    function checkToken(token, callback){
      DB.get('token', {uuid : token}, function(result){
        //token found
        callback(null, result)
      }, function(err){
        //token not found
        if(err.type !== 0){
          logger.debug("token not found, is expired, create new")
          callback(null, false)
        }else{
          callback(err)
        }
      })
    }

    async.waterfall(steps, function(err, result){
      if(err){
        logger.error("err in createToken is", err)
        if(err.msg) {
          reject(err.msg)
        }else if(typeof err == "string"){
          reject(err)
        }else{
          reject('submit internal error', err.toString())
        }
      }else {
        resolve({
          status : true,
          data : result
        })
      }
    })
  });
}
