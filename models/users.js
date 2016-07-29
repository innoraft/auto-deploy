var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    username : { type : String, required : true, unique : true }, 
	token : String,
}, { versionKey: false } );

UserSchema.statics.newUser=function(username,token,callback){
    this.create({username:username, token:token},function(err,data){
        if(err) { 
            var output={status: false, message:err};
            callback(output);
        }
        else
        {
           var output={status: true, id:data._id};
            callback(output);
        }
    });    
};


module.exports = mongoose.model('User', UserSchema);