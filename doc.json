var http=require('http');
var https=require('https');
var fs=require('fs');
module.exports=function(client_sid,client_secret){
	if(!client_sid || !client_secret){
		throw new Error('Invalid arguments list, client_id client_secret required!');
	}
    this.debug=false;
    this.use_app=null;
	//Private area
	{
		var token,subscr_id,app=this,queries=[],
		path="irl-predprod-api.apico.net";
		//path="https://api.apico.net";
		function api_send(input,callback) {
			if(input.url!="oauth2/auth/login" && (!token || !subscr_id)){
				//console.log('push to stack',input);
				queries.push({input:input,callback:callback});
				setTimeout(function(){
					var q=queries.shift();
					if(q){
						//console.log('timeout from stack',q.input);
						q.callback(new Error('Timeout - not logged'));
					}
				},2000);
				return;
			}
			
			if(!input.url){
				err = new Error('URL required!');
				throw err;
			}else{
				input.url="/"+input.url+"?token="+token;
			}
			input.data=input.data||{};
			input.method = input.type || input.method || "POST";
			input.headers=input.headers||{};
			var data=JSON.stringify(input.data);

			input.headers['Content-Type']='application/json';
			var options = {
				hostname: path,
				port: 80,
				path: input.url,
				method: input.method,
				headers: input.headers
			};
			var req = http.request(options, function (res) {
				if(app.debug)console.log('RES STATUS: ' + res.statusCode);
				if(app.debug)console.log('RES HEADERS: ' + JSON.stringify(res.headers));
				var resp='';
				res.on('data',function(chunk){resp+=chunk;});
				res.on('end',function(){
					//BAD.
					var log='Time: '+new Date().toUTCString()+'\r\nRequest: '+JSON.stringify(options)+'\r\nRequest data: '+JSON.stringify(data)+'\r\nResponse: '+resp+'\r\n\r\n';
					fs.appendFile('./log.log',log);

					if(!(res.statusCode-200<100)){
						//console.log(res.statusCode);
					  if(app.debug)console.log('REQ',input,' > ',req._headers);
					  callback(resp||'error');
					  return;
					}

					try{
						var response=JSON.parse(resp);
					}catch(e){
						console.error(e);
						console.log(resp);
						var response=resp;
					}
					if(app.debug)console.log(response);
					callback(null,response);
				})
			});

			req.on('error', function (e) {
				if(app.debug)console.log(input);
				console.log('problem with request: ',e);
				callback(xhr.responseText||'error');
			});
			req.write(data);
			req.end();
		}
	
		function login(login_data,callback){
			if(!login_data || !login_data.client_id || !login_data.client_secret){
				if(app.debug)console.log(login_data);
				return callback(new Error('Invalid arguments list, client_id client_secret required!'));
			}
			login_data.grant_type=login_data.grant_type||'client_credentials';
			api_send({
				url:"oauth2/auth/login",
				data:login_data
			},function(err,response){
				if(err)return callback(err);
				token=response.access_token;
				subscr_id=response.id;
				callback(null,response);
			});
		}
		
		function logout(login_data,callback){
		  api_send({
			url:"oauth2/auth/logout"
		  },function(err,response){
		   if(err)return callback(err);
			token=null;
			callback(null,response);
		  });
		}
		
		login({
			client_id:client_sid,
			client_secret:client_secret
		},function(err,res){
			while(queries.length>0){
				q=queries.shift();
				//console.log('run from stack',q.input);
				if(err){
					q.callback(err);
					//console.log('fail from stack',q.input);
				}else{
					q.input.url=q.input.url.replace('v1/subscribers/undefined','v1/subscribers/'+res.id);//немного смахивает на костыль, да?
					//console.log('run from stack',q.input);
					api_send(q.input,q.callback);
				}
			}
		});
	}

  //Public area
  {
    //=============Subscriber ==============
    this.login=function(login_data,callback){
		console.log('try to login');
      if(!login_data || !login_data.client_id || !login_data.client_secret){
        if(app.debug)console.log(login_data);
        return callback(new Error('Invalid arguments list, client_id client_secret required!'));
      }
      login_data.grant_type=login_data.grant_type||'client_credentials';
      api_send({
        url:"oauth2/auth/login",
        data:login_data
      },function(err,response){
		if(err)return callback(err);
		token=response.access_token;
		subscr_id=response.id;
		console.log(response);
		callback(null,response);
      });
    }
	
    this.logout=function(login_data,callback){
      api_send({
        url:"oauth2/auth/logout"
      },function(err,response){
       if(err)return callback(err);
        token=null;
        callback(null,response);
      });
    }
    this.get_balance=function(input,callback){
		api_send({
			url:"v1/subscribers/"+subscr_id+'/balance',
			type:"GET"
		},function(err,res){
			callback(err,res);
		});
    }
    this.get_numbers_list=function(input,callback){
		api_send({
			url:"v1/subscribers/"+subscr_id+"/numbers",
			type:"GET"
		},function(err,res){
			console.log(res);
			if(err)return callback(err);
			callback(null,res.numbers);
		});
    }
    this.get_subscribers_list=function(input,callback){
      api_send({
        url:"v1/subscribers",
        type:"GET"
      },function(err,res){
        console.log(res,err);
          callback(err,res);
      });
    }
    this.get_subscriber_info=function(input,callback){
      api_send({
        url:"v1/subscribers/"+subscr_id,
        type:"GET"
      },function(err,res){
          callback(err,res.subscriber);
      });
    }

    this.new_subscriber=function(input,callback){
      if(!input.email || !input.password){
        return callback('Email, password required');
      }
      api_send({
        url:"v1/subscribers",
        type:"POST",
        data:input
      },function(err,res){
        console.log(res,err);
          callback(err,res);
      });
    }
    this.update_subscriber=function(input,callback){
      if(!input.email || !input.password || !input.subscriber_id){
        return callback('Email, password, subscriber_id required');
      }
      api_send({
        url:"v1/subscribers/"+input.subscriber_id,
        type:"PUT",
        data:input
      },function(err,res){
        console.log(res,err);
          callback(err,res);
      });

    }
    this.delete_subscriber=function(input,callback){
      if(!input.subscriber_id){
        return callback('subscriber_id required');
      }
      api_send({
        url:"v1/subscribers/"+input.subscriber_id,
        type:"DELETE"
      },function(err,res){
        console.log(res,err);
          callback(err,res);
      });
    }


    //=============App CRUD==============
    this.get_app_list=function(input,callback){
      api_send({
        url:'v1/subscribers/'+subscr_id+'/apps',
        type:"GET"
      },function(err,res){
       if(err)return callback(err);
        callback(null,res.apps);
      });
    }
    this.get_app=function(input,callback){
      api_send({
        url:'v1/subscribers/'+subscr_id+'/apps/'+input.app_id,
        type:"GET"
      },function(err,res){
		  callback(err,res?res.app:null);
	  });
    }
    this.save_app=function(input,callback) {
      if (!input.name || !input.url || !input.description){
        return callback('Invalid arguments list - name,description & url is required');
      }
      api_send({
        url: 'v1/subscribers/'+subscr_id+'/apps',
        type: "POST",
        data:{
          name:input.name,
          description:input.description,
          url:input.url
        }
      }, function (err, res) {
        callback(err, res);
      });
    }
    this.update_app=function(input,callback) {
      if(!input.name || !input.url || !input.app_id){
        return callback('Invalid arguments list - name,url,app_id is required');
      }
      api_send({
        url: 'v1/subscribers/' + subscr_id + '/apps/'+input.app_id,
        type: "PUT",
        data:{
          name:input.name,
          description:input.description,
          url:input.url
        }
      },callback);
    }
    this.delete_app=function(input,callback) {
      if(!input.app_id){
        return callback('Invalid arguments list - app_id is required');
      }
      api_send({
        url: 'v1/subscribers/' + subscr_id + '/apps/'+input.app_id,
        type: "DELETE"
      }, callback);
    }


    //=============Numbers ==============
    this.get_sip_numbers=function(input,callback){
      app.get_numbers({
        type:"SIP",
        location:"INT-NET",
        offset:input.offset||0,
        limit:input.limit||1
      },callback);
    }
    this.get_numbers=function(input,callback){
      api_send({
        url:'v1/numbers',
        data:{
          type:input.type||"SIP",
          location:input.location||"INT-NET",
          offset:input.offset||0,
          limit:input.limit||1
        }
      },function(err,res){
       if(err)return callback(err);
        callback(null,res.numbers);
      });
    }

    this.rent_number=function(input,callback){
      if(!input.number){//todo: check number better
        return callback('Invalid number');
      }
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
        data:{
          number:input.number,
          note:input.note||"Web SDK number",
          type:"SIP"
        }
      },callback);
    }
    this.release_number=function(input,callback){
      if(!input.number){//todo: check number better
        return callback('Invalid number');
      }
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
        type:"DELETE"
      },callback);
    }
    this.update_number=function(input,callback){
		if(!input.number){//todo: check number better
			return callback('Invalid number');
		}
		api_send({
			url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
			type:"PUT",
			data:{
				login:input.login,
				password:input.password,
				note:input.note
			}
		},callback);
    }


    this.get_numbers_by_app=function(input,callback){
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
        type:"GET"
      },function(err,res){
       if(err)return callback(err);
        callback(null,res.numbers);
      });
    }
    this.get_app_number=function(input,callback){
      if(!input.number)return callback('Invalid number '+input.number);
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
        type:"GET"
      },callback);
    }

    //=============Call forwardings CRUD==============
    this.get_number_callforwardings=function(input,callback){
		if(!input.number)return callback('Invalid number '+input.number);
		api_send({
			url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
			type:"GET"
		},function(err,res){
			callback(err,res.callforwardings);
		});
    }
    this.set_number_callforwardings=function(input,callback){
		if(!input.number)return callback('Invalid number '+input.number);
		//todo: validation
		console.log(input);
		var payload={
			redirects:input.redirects
		}
		payload=JSON.stringify(payload);
		api_send({
			url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
			type:"POST",
			data:payload,
			headers:{
			  'Content-Type':'application/json'
			}
		},callback);
    }
    this.update_number_callforwardings=function(input,callback){
      return;
      if(!input.number)return callback('Invalid number '+input.number);
      //todo: validation
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
        type:"POST",
        data:input
      },function(err,res){
       if(err)return callback(err);
        callback(null,res);
      });
    }
    this.delete_number_callforwardings=function(input,callback){
      return;
      if(!input.number)return callback('Invalid number '+input.number);
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
        type:"DELETE"
      },function(err,res){
       if(err)return callback(err);
        callback(null,res);
      });
    }

  }
}