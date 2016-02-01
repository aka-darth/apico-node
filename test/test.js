var should = require('should'),
	apico=require('apico');

//это называется should.be.deepEqual().
function arr_contain_obj(arr,obj,debug){
	next_el:for(var i in arr){
		for(var j in arr[i]){
			if(obj[j] && arr[i][j]!=obj[j]){
				if(debug)console.log('\u001b[33m'+j, arr[i][j],obj[j]+'\u001b[39m')
				continue next_el;
			}else{
				if(debug)console.log('\u001b[36m'+j, arr[i][j],obj[j]+'\u001b[39m');
			}
		}
		return true;
		break;
	}
	return false;
}


var test_data=//[
{
	credits:{
		login:"APICOSDK@APICO.NET",
		password:"4uu1ns7utsu2"
	},
	app:{
		name:'WebSDK autotest app',
		description:'WebSDK autotest generated app',
		url:'october.rain'
	},
	updated_app:{
		name:'autotest update',
		description:'WebSDK autotest updated app',
		url:'october.misty'
	},
	number:{
		note:"WebSDK autotest number",
		redirects:[
			'tralalala',
			'trolololo',
			'polomala',
			'stopudovo'
		]
	},
	updated_number:{
		//login:'UPDATED LOGIN WITH !@#$%^&*()_+}{|"\'\|/!"}',
		//password:'12341234',
		note:"WebSDK autotest number update",
	}
}
//];

describe('Apico', function() {
	this.timeout(15000);
	this.slow(2000);
    Apico=new apico(test_data.credits.login,test_data.credits.password);
	Apico.debug=false;
    it('should be function', function () {
        apico.should.be.function;
    });
    describe('get_balance',function(){
		it('should return number',function(done){
			Apico.get_balance({},function(err,res){
				if(res)res.balance.should.be.Number();
				done(err?new Error(err):null);
			})
		});
    });
//=========<    

 
 
    describe('get_subscribers_list',function(){
		it('should return array',function(done){
			Apico.get_subscribers_list({},function(err,res){
				if(res)res.should.be.Array();
				done(err?new Error(err):null);
			})
		})		
    });
    describe('get_subscriber_info',function(){
		it('should return object with subscriber info',function(done){
			Apico.get_subscriber_info({},function(err,res){
				if(res){
					res.email.should.be.exactly(test_data.credits.login);
				}
				done(err?new Error(err):null);
			})
		});		
    });
    describe('new_subscriber',function(){
		it('should create new subcriber');
    });
    describe('update_subscriber',function(){
		
    });
    describe('delete_subscriber',function(){
		
    });

	
 
//=========>   
	describe('save_app',function() {
		it('should create new app',function(done){
			Apico.save_app(test_data.app,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(201);
				res.app_id.should.have.property('length').which.is.exactly(32);
				test_data.app.app_id=res.app_id;
				test_data.number.app_id=res.app_id;
				test_data.updated_number.app_id=res.app_id;
				test_data.app.secret_key=res.secret_key;
				done(err);
			});
		});
    }); 
	describe('get_app_list',function(){
		it('should return array with created app',function(done){
			Apico.get_app_list({},function(err,apps){
				should.exist(apps);
				apps.should.be.Array();
				arr_contain_obj(apps,test_data.app).should.be.ok();
				done(err?new Error(err):null);
			});
		});
    });
    describe('update_app',function() {
		it('should update app',function(done){
			test_data.updated_app.app_id=test_data.app.app_id;
			Apico.update_app(test_data.updated_app,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(200);
				done(err?new Error(err):null);
			});
		});
    });
	describe('get_app',function() {
		it('should return updated app',function(done){
			Apico.get_app({
				app_id:test_data.updated_app.app_id
			},function(err,res){
				should.exist(res);
				res.should.containEql(test_data.updated_app);
				done(err?new Error(err):null);
			})
		})
    });
	describe('get_sip_numbers',function(){
		it('should return array',function(done){
			Apico.get_sip_numbers({},function(err,res){
				if(res)res.should.be.Array();
				test_data.number.number=res[0].number;
				done(err?new Error(err):null);
			});
		});
    });
    describe('rent_number',function(){
		it('should rent number to app',function(done){
			Apico.rent_number(test_data.number,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(201);
				res.login.should.be.exactly(test_data.number.number);
				test_data.updated_number.number=test_data.number.login=res.login;
				test_data.number.password=res.password;
				done(err?new Error(err):null);
			});
		});
    });
    describe('get_numbers_by_app',function(){
		it('should return array with rented number from previous test',function(done){
			Apico.get_numbers_by_app({
				app_id:test_data.updated_app.app_id
			},function(err,numbers){
				should.exist(numbers);
				numbers.should.be.Array();
				arr_contain_obj(numbers,test_data.number).should.be.ok();
				done(err?new Error(err):null);
			})
		});
    });
	describe('update_number',function(){
		it('should update test number info',function(done){
			Apico.update_number(test_data.updated_number,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(200);
				done(err?new Error(err):null);
			});
		});
    });
    describe('get_app_number',function(){
		it('should return updated test number',function(done){
			Apico.get_app_number(test_data.updated_number,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(200);
				res.should.containEql(test_data.updated_number);
				done(err?new Error(err):null);
			});
		});
    });
//=========<    



    describe('set_number_callforwardings',function(){
		it('it should set callforwardings',function(done){
			Apico.set_number_callforwardings(test_data.number,function(err,res){
				console.log(err,res);
				should.exist(res);
				res.should.be.Array();
				done(err?new Error(err):null);
			});
		});
    });
	describe('get_number_callforwardings',function(){
		it('should get callforwardings array',function(done){
			Apico.get_number_callforwardings(test_data.number,function(err,res){
				should.exist(res);
				res.should.be.Array();
				done(err?new Error(err):null);
			});
		});
    });
    describe('update_number_callforwardings',function(){
		it('it should do something');
    });
	describe('delete_number_callforwardings',function(){
		it('it should do something');
    });

    
	
//=========>
	describe('release_number',function(){
		it('should release updated test number',function(done){
			Apico.release_number(test_data.updated_number,function(err,res){
				should.exist(res);
				res.status.should.be.exactly(200);
				res.message.should.be.exactly('OK');
				done(err?new Error(err):null);
			});
		});
    });
	describe.skip('get_numbers_list',function(){
		it('should return array of all subscriber number and without released test number',function(done){
			Apico.get_numbers_list({},function(err,res){
				if(res)res.should.be.Array();
				arr_contain_obj(res,test_data.number).should.not.be.ok();
				done(err?new Error(err):null);
			})
		})
    });
	describe('delete_app',function() {
		it('should delete app',function(done){
			Apico.delete_app({
				app_id:test_data.updated_app.app_id
			},function(err,res){
				res.status.should.be.exactly(200);
				res.message.should.be.exactly('OK');
				done(err?new Error(err):null);
			})
		});
    });
	describe('get_app',function() {
		it('should fail (app really deleted)',function(done){
			Apico.get_app({
				app_id:test_data.updated_app.app_id
			},function(err,res){
				should.not.exist(res);
				err.should.be.ok();
				//console.log(err);
				done(!err);
			})
		})
    });	
});