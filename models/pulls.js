var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PullSchema   = new Schema({
    //pid : { type : String, required : true, unique : true },
    hookid : String,
	branch : String,
	serverip : String,
	serveruser : String,
	serverpass : String,
	serverpath : String,
	command : String,
}, { versionKey: false } );

PullSchema.statics.newPull=function(id, branch,serverip,serveruser,serverpass,serverpath,command,callback){
    this.create({
    hookid:id,
    branch : branch,
	serverip : serverip,
	serveruser : serveruser,
	serverpass : serverpass,
	serverpath : serverpath,
	command : command},function(err,data){
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

PullSchema.statics.getPull=function(id, branch, callback){
    this.findOne({id:id, branch:branch},function(err,data){
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


module.exports = mongoose.model('Pull', PullSchema);