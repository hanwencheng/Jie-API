/**
 * Created by hanwencheng on 1/11/16.
 */
var awsBucketName = 'test.omzug.com'
if(process.env.NODE_ENV === "production"){
  awsBucketName = 'omzug.com'
}

module.exports = {
  host : 'localhost:27017',
  databaseName: 'jie-api',
  dbUser : 'xinyue',
  dbPassword : '010702heihei',
  //please list the collection names one by one
  userCollectionName : 'user',
  houseCollectionName : 'house',
  postCollectionName : 'post',
  tokenCollectionName : 'token',
  sessionAge : 1 * 24 * 60 * 60 * 1000,
  locationCalculateLimit : 20,
  appId : "5c900d994e5c0571fcd479789db51af205a73ea4e58ad510",
  pageSize : 9,
  awsFolder : "photos",
  awsPostFolder : "posts",
  awsExpire : 60,
  awsBucket : awsBucketName,
  awsPostPrefix : 'https://s3.eu-central-1.amazonaws.com/' + awsBucketName + '/posts/',
  awsPrefix : 'https://s3.eu-central-1.amazonaws.com/' + awsBucketName + '/photos/',
  tmpPath : './tmp',
  googleMapKey : 'AIzaSyA7ZTgeyDPxcVEjsa6IuTH41k__n954cU4',

  errors : {
    LackParameterError : 'LackParameterError : Request does not have enough parameter',
    WrongRequestError : 'WrongRequestError : Request parameter does not qualified',
    WrongLocationError : "WrongLocationError : Request contained false location information",
    SchemaCannotFind : 'SchemaCannotFind: schema can not be find, please check again:',
    DataBaseFailed : 'DataBaseFailed: database meet error:',
    AuthFailed : 'Authentication Error:',
    NotFound : 'the item not found in database:',
  },

  logOptions : {
    "debugLevel" : "debug",
    "level": "info",
    "filename": "./logs/omzug",
    "filesize": "10000000",
    "filecount": "100"
  }
}