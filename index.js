var http=require('http'),
https=require('https'),
fs=require('fs'),
path=require('path');
/**
 * apico
 * @constructs apico
 * @param {string} client_sid - your Apico api login
 * @param {string} client_secret - your Apico api password
 */
module.exports=function(client_sid,client_secret){
	if(!client_sid || !client_secret){
		throw new Error('Invalid arguments list, client_id client_secret required!');
	}
    this.debug=false;
    this.predprod=false;
    this.use_app=null;
	//Private area
	{
		var token,subscr_id,app=this,queries=[],
            baseurl=app.predprod?"irl-predprod-api.apico.net":"api.apico.net";
        function waiting_request(input,cb){
            if(app.debug)console.log('push to stack',input);
            queries.push({input:input,callback:cb});
            setTimeout(function(){
                var q=queries.shift();
                if(q){
                    //console.log('timeout from stack',q.input);
                    q.callback(new Error('Timeout - not logged'));
                }
            },2000);

        }
        function send_waiting_request(err,res){
            while(queries.length>0){
                q=queries.shift();
                if(app.debug)console.log('run from stack',q.input);
                if(err){
                    q.callback(err);
                }else{
                    q.input.url=q.input.url.replace('v1/subscribers/undefined','v1/subscribers/'+res.id);//немного смахивает на костыль, да?
                    api_send(q.input,q.callback);
                }
            }
        }
		function api_send(input,callback) {
			if(input.url!="oauth2/auth/login" && (!token || !subscr_id)){
                waiting_request(input,callback);
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
            input.headers.accept='*/*';
            var data=JSON.stringify(input.data);

			input.headers['Content-Type']='application/json';
			var options = {
				hostname: baseurl,
				port: app.predprod?80:443,
				path: input.url,
				method: input.method,
				headers: input.headers
			};
			var req = (app.predprod?http:https).request(options, function (res) {
				if(app.debug)console.log('RES STATUS: ' + res.statusCode);
				if(app.debug)console.log('RES HEADERS: ' + JSON.stringify(res.headers));
				var resp='';
				res.on('data',function(chunk){resp+=chunk;});
				res.on('end',function(){
					//BAD.
					var log='Time: '+new Date().toUTCString()+'\r\nRequest: '+JSON.stringify(options)+'\r\nRequest data: '+JSON.stringify(data)+'\r\nResponse: '+resp+'\r\n\r\n';
					fs.appendFile(path.join(__dirname,'log.log'),log);

					if(!(res.statusCode-200<100)){
                        if(app.debug)console.log('REQ',input,' > ',req._headers);
                        if(res.statusCode==401 && input.url!="oauth2/auth/login"){
                            //token expired
                            input.url=input.url.split('?token=')[0].substr(1);//rollback url
                            waiting_request(input,callback);
                            login({
                                client_id:client_sid,
                                client_secret:client_secret
                            },send_waiting_request);
                            return;
                        }else return callback(resp||'error');
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
				callback(req.responseText||'error');
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
		},send_waiting_request);
	}

    //Public area
    {
    //=============Subscriber ==============
    /** <a href='https://www.apico.net/docs/api/rest/login' target='_blank'>Apico API/login</a>
    *@param {string} client_sid - your Apico api login
    *@param {string} client_secret - your Apico api password
    *@param {string} [grant_type=client_credentials] - your Apico api grant_type
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/post-logout' target='_blank'>Apico API/login</a>
    */
    this.logout=function(login_data,callback){
      api_send({
        url:"oauth2/auth/logout"
      },function(err,response){
       if(err)return callback(err);
        token=null;
        callback(null,response);
      });
    }
    /**<a href='https://www.apico.net/docs/api/rest/check-account-balance' target='_blank'>Apico API/subscribers/{subscriber_id}/balance</a>
    */
    this.get_balance=function(input,callback){
        api_send({
            url:"v1/subscribers/"+subscr_id+'/balance',
            type:"GET"
        },function(err,res){
            callback(err,res);
        });
    }
    /**<a href='https://www.apico.net/docs/api/rest/all-numbers-subscriber' target='_blank'>Apico API/subscribers/{subscriber_id}/numbers</a>
    */
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
    /**<a href='https://www.apico.net/docs/api/rest/subscribers' target='_blank'>Apico API/subscribers</a>
    */
    this.get_subscribers_list=function(input,callback){
      api_send({
        url:"v1/subscribers",
        type:"GET"
      },function(err,res){
        console.log(res,err);
          callback(err,res);
      });
    }
    /**<a href='https://www.apico.net/docs/api/rest/get-subscriber-info' target='_blank'>Apico API/subscribers/{subscriber_id}</a>
    */
    this.get_subscriber_info=function(input,callback){
      api_send({
        url:"v1/subscribers/"+subscr_id,
        type:"GET"
      },function(err,res){
          callback(err,res.subscriber);
      });
    }

    /** <a href='https://www.apico.net/docs/api/rest/   ' target='_blank'>Apico API/subscribers</a>
    */
    this.new_subscriber=function(input,callback){
      if(!input.email || !input.password){
        return callback('Email, password required');
      }
      api_send({
        url:"v1/subscribers",
        type:"POST",
        data:input
      },function(err,res){
        //console.log(res,err);
        callback(err,res);
      });
    }
    /** <a href='https://www.apico.net/docs/api/rest/   ' target='_blank'>Apico API/subscribers</a>
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/   ' target='_blank'>Apico API/subscribers</a>
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/list-all-applications' target='_blank'>Apico API/subscribers/{subscriber_id}/apps</a>
    */
    this.get_app_list=function(input,callback){
      api_send({
        url:'v1/subscribers/'+subscr_id+'/apps',
        type:"GET"
      },function(err,res){
       if(err)return callback(err);
        callback(null,res.apps);
      });
    }
    /** <a href='https://www.apico.net/docs/api/rest/get-application-info' target='_blank'>Apico API/subscribers/{subscriber_id}/apps/{app_id}</a>
    */
    this.get_app=function(input,callback){
      api_send({
        url:'v1/subscribers/'+subscr_id+'/apps/'+input.app_id,
        type:"GET"
      },function(err,res){
          callback(err,res?res.app:null);
      });
    }
    /** <a href='https://www.apico.net/docs/api/rest/register-application' target='_blank'>Apico API/subscribers/{subscriber_id}/apps/{app_id}</a>
    *@param {string} name - Application name (255 characters max).
    *@param {string} description - Application description (255 characters max).
    *@param {string} url - The URL to the developer’s website or the page of the application on App Store or Google Play (255 characters max).
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/update-application-info' target='_blank'>Apico API/subscribers/{subscriber_id}/apps/{app_id}</a>
    *@param {string} name - Application name (255 characters max).
    *@param {string} [description] - Application description (255 characters max).
    *@param {string} url - The URL to the developer’s website or the page of the application on App Store or Google Play (255 characters max).
    *@param {string} app_id - Application id.
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/delete-application-info' target='_blank'>Apico API/subscribers/{subscriber_id}/apps/{app_id}</a>
    *@param {string} app_id - Application id.
    */
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
    /**
    * @param {number} [offset=0] - offset
    * @param {number} [limit=1] - limit
    */
    this.get_sip_numbers=function(input,callback){
      app.get_numbers({
        type:"SIP",
        location:"INT-NET",
        offset:input.offset||0,
        limit:input.limit||1
      },callback);
    }
    /** <a href='https://www.apico.net/docs/api/rest/available-numbers' target='_blank'>Apico API/available-numbers</a>
    * @param {string} [type=SIP] - The type of returning phone numbers. This parameter can either be NATIONAL or SIP.
    * @param {string} [location=INT-NET] - The region name for the specified type of phone numbers. US—United States, DE—Germany, FR—France, CA—Canada, FI—Finland, AT—Austria, CH—Switzerland, PL—Poland, SE—Sweden, IT—Italy, LU—Luxemburg, ES—Spain, MX—Mexico, PT—Portugal, IL—Israel, CZ—Czech Republic, DK—Denmark.
    * @param {number} [offset=0] - offset
    * @param {number} [limit=1] - limit
    */
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
    /** <a href='https://www.apico.net/docs/api/rest/rent-phone-number' target='_blank'>Apico API/apps/{app_id}/numbers</a>
    * @param {string} number - The phone number which is being rented.
    * @param {string} [note="Web SDK number"] - A short description of the phone number
    */
    this.rent_number=function(input,callback){
      if(!input.number){//todo: check number better
        return callback('Invalid number');
      }
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
        data:{
          number:input.number,
          note:input.note||"Web SDK number",
          type:input.type||"SIP"
        }
      },callback);
    }
    /** <a href='https://www.apico.net/docs/api/rest/release-number' target='_blank'>Apico API/apps/{app_id}/numbers/{number}</a>
    * @param {string} number - The phone number which is being rented.
    */
    this.release_number=function(input,callback){
      if(!input.number){//todo: check number better
        return callback('Invalid number');
      }
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
        type:"DELETE"
      },callback);
    }
    /** <a href='https://www.apico.net/docs/api/rest/update-number-info' target='_blank'>Apico API/apps/{app_id}/numbers/{number}</a>
    * @param {string} number - The phone number which is being rented.
    * @param {string} [note="Web SDK number"] - A short description of the phone number
    * @param {string} [password] - Password for this number.
    */
    this.update_number=function(input,callback){
        if(!input.number){//todo: check number better
            return callback('Invalid number');
        }
        console.log(input);
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


    /** <a href='https://www.apico.net/docs/api/rest/all-numbers-application' target='_blank'>Apico API/apps/{app_id}/numbers</a>
    */
    this.get_numbers_by_app=function(input,callback){
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
        type:"GET"
      },function(err,res){
       if(err)return callback(err);
        callback(null,res.numbers);
      });
    }
    /** <a href='https://www.apico.net/docs/api/rest/get-number-info' target='_blank'>Apico API/apps/{app_id}/numbers/{number}</a>
    * @param {string} number - The phone number which is being rented.
    */
    this.get_app_number=function(input,callback){
      if(!input.number)return callback('Invalid number '+input.number);
      api_send({
        url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
        type:"GET"
      },callback);
    }

    //=============Call forwardings CRUD==============
    /** <a href='https://www.apico.net/docs/api/rest/get-redirect-settings' target='_blank'>Apico API/apps/{app_id}/numbers/{number}/callforwardings</a>
    * @param {string} number - The phone number.
    */
    this.get_number_callforwardings=function(input,callback){
        if(!input.number)return callback('Invalid number '+input.number);
        api_send({
            url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
            type:"GET"
        },function(err,res){
            callback(err,res.callforwardings);
        });
    }
    /** <a href='https://www.apico.net/docs/api/rest/new-redirect-settings' target='_blank'>Apico API/apps/{app_id}/numbers/{number}</a>
    * @param {string} number - The phone number which is being rented.
    * @param {array} redirects - An array with the redirection settings.
    * @param {number} redirects[].order - A number specifying the order of priority the redirect_number is tried after another. Several redirect numbers may have the same priority order. In this case they all ring at the same time.
    * @param {string} redirects[].redirect_number - A string specifying forwarding destination in E. 164 format.
    * @param {string} redirects[].redirect_name - A string describing forwarding destination represented in symbols.
    * @param {string} redirects[].active - A string specifying if this call forwarding configuration is currently active. Either Y or N.
    * @param {string} redirects[].period - A string specifying time period in which this call forwarding configuration should be active. You can specify limitations regarding the time of day, day of the week, day of the month, or some combination of these.
    * @param {string} redirects[].period_description - A string describing time period in which this call forwarding configuration should be active.
    */
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
    /**
    */
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
    /**
    */
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