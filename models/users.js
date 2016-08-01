var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    username : { type : String, required : true, unique : true }, 
	token : String,
}, { versionKey: false } );

UserSchema.statics.newUser=function(username,callback){
    this.create({username:username},function(err,data){
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

UserSchema.statics.findUser=function(username, callback){
    this.findOne({username:username},function(err,data){
        if(err) { 
            var output={status: false, message:err};
            callback(output);
        }
        else if(data == null) {
            var output={status: false, message:"No User found"};
            callback(output);
        }
        else if(data.token == undefined) {
            User = Users;
            User.removeUser(username, function(done){
                var output={status: false, message:"No Token found"};
                callback(output);
            })
        }
        else
        {
           var output={status: true, token:data.token};
            callback(output);
        }
    });    
};

UserSchema.statics.removeUser=function(username, callback){
    this.remove({username:username},function(err,data){
        if(err) { 
            var output={status: false, message:err};
            callback(output);
        }
        else
        {
           var output={status: true};
            callback(output);
        }
    });    
};

UserSchema.statics.addTokenToUser=function(username,token,callback){
    this.update({username:username},{token:token},function(err,data){
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