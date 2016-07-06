/**
 * Created by hanwencheng on 7/5/16.
 */

import DB from '../../lib/db-interface.js';
import {logger} from '../../lib/logger'
import uuid from 'node-uuid'
import uuidCheck from 'uuid-validate'
var config = require('../../lib/config');
const async = require('async')
import {isNumeric} from '../../utils/common.js';

/**
 * sample request : /saveLocation/4af655a0-4230-11e6-ac77-79556581963e/
 */
export default function calculateLocation(req, params) {


  logger.debug('get request in calculateLocation.js with params: ', params ,
    "\n body : " , req.query)

  const LackParameterError = config.errors.LackParameterError
  const WrongRequestError = config.errors.WrongRequestError
  const WrongLocationError = config.errors.WrongLocationError
  var location = {
    latitude : (req.query.latitude / Math.pow(10, 6 )).toFixed(6),
    longitude : (req.query.longitude / Math.pow(10, 6 )).toFixed(6),
  }

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
      checkLocation,
      checkToken,
      calculate,
    ]

    function validateParams(callback){
      if(params.length < 1){
        return callback(LackParameterError)
      }else{
        if(!uuidCheck(params[0])){
          return callback(WrongRequestError)
        }else
          callback(null)
      }
    }

    function checkLocation(callback){
      if(!location.hasOwnProperty("latitude") || !location.hasOwnProperty("longitude"))
        return callback(LackParameterError)

      if(!isNumeric(location.latitude) || !isNumeric(location.longitude || !isNumeric(location.range)))
        return callback(WrongLocationError + "-> not number")

      if(location.latitude >90 || location.latitude < -90)
        return callback(WrongLocationError + "-> latitude")

      if(location.longitude >90 || location.longitude < -90)
        return callback(WrongLocationError + "-> longitude")

      if(location.range <= 0)
        return callback(WrongLocationError + "-> range")

      return callback(null)
    }


    function checkToken(callback){
      DB.get('token', { uuid : params[0]}, function(result){
        //token found
        callback(null)
      }, function(err){
        callback(err)
      })
    }

    function calculate(callback){
      var center = [location.longitude, location.latitude]
      DB.getNear(center, 1.8, function(result){
        logger.trace('successful update location in database: ', result.data)
        result.data.filter(function(obj){
          return obj.uuid !== params[0]
        })
        callback(null, result.data)
      },function(err){
        callback(err)
      })
    }

    async.waterfall(steps, function(err, result){
      if(err){
        logger.error("err in calculation location is", err)
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
