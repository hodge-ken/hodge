var mongoose = require('mongoose'),
Uploadfile = mongoose.model('Uploadfile'),
User = mongoose.model('User'),
async = require('async'), 
_ = require('lodash'),
path = require('path'),
email = require(path.resolve('./node_modules/emailjs/email')),
server = email.server.connect({
   user:    "filestation@buildwin.com.cn", 
   password: "eVw*35sd", 
   host:    "smtp.buildwin.com.cn", 
   tls: {ciphers: "SSLv3"}
});

exports.start = function(data, done) {
	done(data);
};

exports.draft = function(data, done) {
	this.setProperty('users', [data.req.user._id + '']);
	this.setProperty('roles', []);
	this.setProperty('processedByUserId', data.req.user._id + '');
	this.setProperty('processedBy', data.req.user.displayName);
	this.setProperty('createdByUserId', data.req.user._id + '');
	this.setProperty('createdBy', data.req.user.displayName);
	this.setProperty('task', 'draft');
	this.setProperty('status', 'not submitted');
	done(data);
};

exports.draftDone = function(data, done) {
	done(data);
}

exports.need_approval_ = function(data, done) {
	data.needApproval = false;
	async.waterfall([
	  function(callback) {
	  	Uploadfile.find({processId: data.req.pogfapproval._id + ''}).exec(function(err, ufiles){
	  		var totalFilesSize = 0;
	  		_.forEach(ufiles, function(ufile){
	  			var regEx =/[^\s]+\.(cpp|c|jpg)$/i;
	  			if (regEx.test(ufile.fileOriginalName)) {
	  				data.needApproval = true;
	  			}
	  			totalFilesSize = totalFilesSize + ufile.fileSize;
	  		})
	  		if (totalFilesSize > 1000000) {
	  			data.needApproval = true;
	  		}
	  		if ( data.req.pogfapproval.recipient.indexOf(data.req.user.email) != -1 ) {
	  			data.needApproval = true;
	  		}
	  		callback(null);
		});
	  }
	], function(err, results){
		done(data);
	});
}

exports.need_approval_$need = function(data, done) {
	return data.needApproval;
}

exports.need_approval_$nneed = function(data, done) {
	return !data.needApproval;
}

exports.no_approval = function(data, done) {
	var myProcess = data.req.process;
	async.waterfall([
		function(callback) {
			var emailList = "";
			User.find({roles: { $in: ['pogfapprover']}}).exec(function(err, pogfapprovers){
				_.forEach(pogfapprovers, function(approver){
					if (approver.email) {
						if (emailList === '') {
							emailList = emailList + approver.email;	
						} else {
							emailList = emailList + ', ' + approver.email;
						}
					}
				}) 
				callback(null, emailList);
			});
		}
	], function(err, emailList) {
		var text = "Dear approver, ";
		text = text + "\n\nOutgoing file email sent from " + data.req.user.displayName + ".";
		text = text + "\nThe following link is the application process for your perusal: ";
		text = text + "\nhttps://filestation.buildwin.com/pogfapprovals/" + data.req.pogfapproval._id + "/edit";
		text = text + "\n\n\nThis is a machine generated email, please do not reply.";
		var message	= {
		   text:	text, 
		   from:	"filestation@buildwin.com.cn", 
		   to:		emailList,
		   subject:	"Notification: Outgoing file skip approval email sent by " + data.req.user.displayName 
		};
		// send the message and get a callback with an error or details of the message that was sent 
		server.send(message, function(err, message) { 
			console.log(err || message);
		});
	});
	done(data);
	myProcess.taskDone('no approval', {req: data.req});
}

exports.no_approvalDone = function(data, done) {
	done(data);
}

exports.approval = function(data, done) {
	this.setProperty('users', []);
	this.setProperty('roles', ['admin', 'pogfapprover']);
	this.setProperty('processedByUserId', data.req.user._id);
	this.setProperty('processedBy', data.req.user.displayName);
	this.setProperty('task', 'approval');
	this.setProperty('status', 'awaiting approval');
	async.waterfall([
		function(callback) {
			var emailList = "";
			User.find({roles: { $in: ['pogfapprover']}}).exec(function(err, pogfapprovers){
				_.forEach(pogfapprovers, function(approver){
					if (approver.email) {
						if (emailList != '') {
							emailList = emailList + ', ' + approver.email;
						} else {
							emailList = emailList + approver.email;	
						}
					}
				}) 
				callback(null, emailList);
			});
		}
	], function(err, emailList) {
		var text = "Dear approver,";
		text = text + "\n\nYou have outgoing file approval from " + data.req.user.displayName + ".";
		text = text + "\nThe following link is the application process for your action: ";
		text = text + "\nhttps://filestation.buildwin.com/pogfapprovals/" + data.req.pogfapproval._id + "/edit";
		text = text + "\n\n\nThis is a machine generated email, please do not reply.";
		var message	= {
		   text:	text, 
		   from:	"filestation@buildwin.com.cn", 
		   to:		emailList,
		   subject:	"Notification: Outgoing file awaiting approval from " + data.req.user.displayName 
		};
		// send the message and get a callback with an error or details of the message that was sent 
		server.send(message, function(err, message) { 
			console.log(err || message);
		});
	})
	done(data);
};

exports.approvalDone = function(data, done) {
	done(data);
};

exports.is_approved_ = function(data, done) {
	done(data);
};

exports.is_approved_$ok = function(data, done) {
	return data.req.pogfapproval.approval === 'approved';
};

exports.is_approved_$nok = function(data, done) {
	return data.req.pogfapproval.approval === 'rejected';
};


exports.is_approved_$withdrawn = function(data, done) {
	return data.req.pogfapproval.approval === 'withdrawn';
}

exports.approved = function(data, done) {
	this.setProperty('task', 'approved');
	var users = [this.getProperty('createdBy')];
	this.setProperty('users', users);
	this.setProperty('status', 'approved');
	var req = data.req;
	Uploadfile.update({processId: req.pogfapproval._id + ''}, {$set: { openAccess: true , openAccessTime: Date.now()}}).exec(function(err){
	});
	var myProcess = data.req.process;
	done(data);	
	myProcess.taskDone('approved', {req: data.req});
};

exports.approvedDone = function(data, done) {
	done(data)
}

exports.email_recipient = function(data, done) {
	var myProcess = data.req.process;

	var text = "Dear,";
	text = text + "\n\nPlease open the following link to download files.";
	text = text + "\nhttps://filestation.buildwin.com/uploadfiles/d/" + data.req.pogfapproval._id;
	text = text + "\nMessage from sender:";
	text = text + "\n" + data.req.pogfapproval.emailText;
	text = text + "\n\n\nThis is a machine generated email, please do not reply.";
	
	var message	= {
	   text:	text, 
	   from:	"filestation@buildwin.com.cn", 
	   to:		data.req.pogfapproval.recipient,
	   subject:	"Files for downloading"
	};
	// send the message and get a callback with an error or details of the message that was sent 
	server.send(message, function(err, message) { 
		console.log(err || message);
		myProcess.taskDone('email recipient'); 
	});
}

exports.email_recipientDone = function(data, done) {
	this.setProperty('status', 'email sent');
	done(data);
}

exports.rejected = function(data, done) {
	this.setProperty('task', 'rejected');
	var users = [this.getProperty('createdBy')];
	this.setProperty('users', users);
	this.setProperty('status', 'rejected');
	done(data);
	var myProcess = data.req.process;
	myProcess.taskDone('rejected');
};

exports.rejectedDone = function(data, done) {
	done(data);
}

exports.end = function(data, done) {
	done(data);
};
