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
export default function saveLocation(req, params) {


  logger.debug('get request in saveLocation.js with params: ', params)

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
      updateLocation,
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

      if(!isNumeric(location.latitude) || !isNumeric(location.longitude))
        return callback(WrongLocationError + "-> not number")

      if(location.latitude >90 || location.latitude < -90)
        return callback(WrongLocationError + "-> latitude")

      if(location.longitude > 180 || location.longitude < -180)
        return callback(WrongLocationError + "-> longitude")

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

    function updateLocation(callback){
      var neu = {
        location : [location.longitude, location.latitude]
      }
      DB.update('token', {uuid : params[0]}, neu, function(result){
        logger.trace('successful update location in database: ', result.data)
        callback(null, result.data)
      },function(err){
        callback(err)
      })
    }

    async.waterfall(steps, function(err, result){
      if(err){
        logger.error("err in saveLocation is", err)
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
