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
      checkToken,
      saveToken,
    ]

    function validateParams(callback){
      if(params.length < 1){
        return callback(null, false)
      }else if(params.length === 1){
        if(!uuidCheck(params[0])){
          return callback(null, false)
        }else
          callback(null, params[0])
      }else{
        callback(WrongRequestError)
      }
    }


    function checkToken(token, callback){
      //if no token in request
      if(!token)
        return callback(null, false)

      DB.get('token', {uuid : token}, function(result){
        //token found
        callback(null, result)
      }, function(err){
        //token not found
        if(err.type == 1){
          logger.debug("token not found, is expired, create new")
          callback(null, false)
        }else{
          console.log("error happened in internal create token")
          callback(err)
        }
      })
    }

    function saveToken(inDatabase,callback){
      if(inDatabase){
        callback(null, inDatabase.data)
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
