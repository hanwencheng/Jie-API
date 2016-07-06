var validate = require('mongoose-validator');

module.exports = function(Schema, collectionName){
  var ObjectId = Schema.ObjectId;
  return new Schema({
    uuid : {type : String , required : true},
    //owner : {type : ObjectId, required : false},
    username : {type : String, required : false},

    location: {
      type: [Number],  // [<longitude>, <latitude>]
      index: '2dsphere',      // create the geospatial index
      required : false
    }

  }, {
    strict      : true,
    collection  : collectionName,
    timestamps  : {
      updatedAt: {
        type: Date,
        expires: '7d'
      }
    }
  });
}
