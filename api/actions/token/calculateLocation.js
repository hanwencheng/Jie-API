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
import request from 'request'

/**
 * sample request : /saveLocation/4af655a0-4230-11e6-ac77-79556581963e/
 */
export default function calculateLocation(req, params, io) {


  logger.debug('get request in calculateLocation.js with params: ', params ,
    "\n body : " , req.query)

  const LackParameterError = config.errors.LackParameterError
  const WrongRequestError = config.errors.WrongRequestError
  const WrongLocationError = config.errors.WrongLocationError
  var location = {
    latitude : parseFloat(decodeURI(req.query.latitude)),
    longitude : parseFloat(decodeURI(req.query.longitude)),
    need : decodeURI(req.query.need),
    range : decodeURI(req.query.range) //todo to be used later
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
      sendNotification
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
        return callback(WrongLocationError + "-> latitude : " + location.latitude)

      if(location.longitude >180 || location.longitude < -180)
        return callback(WrongLocationError + "-> longitude : " + location.longitude)

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
      console.log("now start calculate in db" , center)
      DB.getNear(center, 1.8, function(result){
        var filtered = []
        result.data.forEach(function(item){
          if(item.obj.uuid !== params[0]) {
            filtered.push(item)
          }
        })
        callback(null, filtered)
      },function(err){
        callback(err)
      })
    }

    function sendNotification(filtered, callback){
      //if(filtered.length == 0)
      //  return callback(null, filtered)

      var targetList = []
      filtered.forEach(function(item){
        targetList.push({
          token : item.obj.uuid,
          distance  : Math.round(item.dis)
        })
      })

      console.log('send target list is', targetList)
      io.emit("askHelp", {
        target : targetList,
        need : location.need,
        asker : params[0],
      })
      callback(null, filtered)
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
