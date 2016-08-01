var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var HookSchema   = new Schema({
    hookid : String,
    user: String,
	repo : String,
}, { versionKey: false } );

HookSchema.statics.newHook=function(id,user, repo, callback){
    this.create({
    hookid: id,
    user: user,
    repo : repo
    },function(err,data){
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

HookSchema.statics.getHook=function(user, repo, callback){
    this.findOne({user:user,repo:repo},function(err,data){
        if(err) { 
            var output={status: false, message:err};
            callback(output);
        }
        else
        {
           var output={status: true, data:data};
            callback(output);
        }
    });    
};


module.exports = mongoose.model('Hook', HookSchema);