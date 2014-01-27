var mongoose = require('mongoose'),
    crypto = require('crypto');

var Schema=mongoose.Schema;
var UserSchema= new Schema({
    
    email: {type: String, unique: true, required: true},
    hashed_password: {type:  String, required: true},
    organization: {type: String, required: true},
    salt: String

});
var RoomSchema=new Schema({
    Room_id: {type: Schema.ObjectId, required:true},
    organization: {type: String, required: true}
});


   UserSchema.virtual('password').get(function(){
       return this._password; 
   });

  UserSchema.virtual('password').set(function(password){
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    });



UserSchema.methods.authenticate=function(plainText) {
      return this.encryptPassword(plainText) === this.hashed_password;
    }

   UserSchema.methods.makeSalt=function() {
      return Math.round((new Date().valueOf() * Math.random())) + '';
    }

   UserSchema.methods.encryptPassword = function(password) {
       return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
}


   UserSchema.methods.isValid = function() {
      // TODO: Better validation
      return this.email && this.email.length > 0 && this.email.length < 255
             && this.password && this.password.length > 0 && this.password.length < 255;
    }

    UserSchema.methods.savee = function(okFn, failedFn) {
	console.log("Save Called");
      if (this.isValid()) {
	  console.log("Valid");
        this.save(okFn);
      } else {
	  console.log("not valid");
        failedFn();
      }
    }
  

var User=mongoose.model('User', UserSchema);
var Room=mongoose.model('Room', RoomSchema);
module.exports=User;
module.exports=Room;
