window.Apico=new function(){
    //Private area
    {
        var token,subscr_id,listeners={},
            app=this,
            path="http://irl-predprod-api.apico.net";
            //path="https://api.apico.net";
        function api_send(input,callback){
            if(!input.url){
                err = new Error('URL required!');
                throw err;
            }else{
                input.url=path+"/"+input.url+"?token="+token;
            }
            //input.data=input.data||{};
            //input.data.token=token;
            input.method=input.type||input.method||"POST";
            var xhr = new XMLHttpRequest();
            xhr.open(input.method, input.url);
            for(var name in input.headers){
                xhr.setRequestHeader(name, input.headers[name]);
            }

            if((input.method=="POST" || input.method=="PUT") && (!input.headers || !input.headers['Content-Type'])){
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }// && input.data?
            var data='';
            if(typeof input.data!='string'){
                for(var name in input.data){
                    data+=name+'='+input.data[name]+'&';
                }
            }else{
                data=input.data;
            }

            xhr.send(data);
            xhr.onerror=function(){
                if(app.debug)console.log(input);
                throw_err(xhr.responseText||'error');
            }
            xhr.onload=function(res){
                if(!(xhr.status-200<100)){
                    if(app.debug)console.log(input);
                    throw_err(xhr.responseText||'error');
                    return;
                }
                try{
                    var response=JSON.parse(xhr.responseText);
                }catch(e){
                    console.error(e);
                    console.log(xhr.responseText);
                    var response=xhr.responseText;
                }
                if(app.debug){
                    var out=document.getElementById('responses');
                    if(out){
                        out.value+="Request\n"+JSON.stringify(input)+"\n";
                        out.value+="Response\n"+xhr.responseText+"\n\n";
                        out.scrollTop = out.scrollHeight - out.clientHeight;
                    }
                }
                callback(null,response);
            }
        }
        Object.defineProperty(app, "onerror", {
            get: function() {
                return "(setter of [error handlers])";
            },
            set: function(listener) {
                if(!listeners.error){
                    listeners.error=[];
                }
                listeners.error.push(listener);
            }
        });
        function throw_err(message,code){
            var err=new Error(message);
            err.code=code;
            if(listeners.error){
                for(i in listeners.error){
                    listeners.error[i](err);
                }
            }else{
                throw err;
            }
        }
    }

    //Public area
    {
        this.debug=(document.cookie.indexOf('apico_debug=1')!=-1)||true;
        this.use_app=null;
        this.v='0.0.0';
        this.init=function(){
            console.log('Apico ready v'+app.v);
        };

        //=============Subscriber ==============
        this.login=function(login_data,callback){
            if(!login_data.client_id || !login_data.client_secret){
                if(app.debug)console.log(login_data);
                throw_err('Invalid arguments list, client_id client_secret required!');
            }
            login_data.grant_type=login_data.grant_type||'client_credentials';
            api_send({
                url:"oauth2/auth/login",
                data:login_data
            },function(err,response){
                if(err)throw err;
                token=response.access_token;
                subscr_id=response.id;
                if(app.debug)console.log('Logged');
                callback(response);
            });
        }
        //Task SAIMAANDR-2
        //Написать функцию разавторизации (logout) подписчика
        this.logout=function(login_data,callback){
            api_send({
                url:"oauth2/auth/logout"
            },function(err,response){
                if(err)throw err;
                token=null;
                callback(response);
            });
        }
        this.get_balance=function(input,callback){
            api_send({
                url:"v1/subscribers/"+subscr_id+'/balance',
                type:"GET"
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }
        this.get_numbers_list=function(input,callback){
            api_send({
                url:"v1/subscribers/"+subscr_id+"/numbers",
                type:"GET"
            },function(err,res){
                if(err)throw err;
                callback(res.numbers);
            });
        }
        this.get_subscribers_list=function(input,callback){
            api_send({
                url:"v1/subscribers",
                type:"GET"
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }
        this.get_subscriber_info=function(input,callback){
            api_send({
                url:"v1/subscribers/"+subscr_id,
                type:"GET"
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }

        this.new_subscriber=function(input,callback){
            if(!input.email || !input.password){
                return throw_err('Email, password required');
            }
            api_send({
                url:"v1/subscribers",
                type:"POST",
                data:input
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }
        this.update_subscriber=function(input,callback){
            if(!input.email || !input.password || !input.subscriber_id){
                return throw_err('Email, password, subscriber_id required');
            }
            api_send({
                url:"v1/subscribers/"+input.subscriber_id,
                type:"PUT",
                data:input
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });

        }
        this.delete_subscriber=function(input,callback){
            if(!input.subscriber_id){
                return throw_err('subscriber_id required');
            }
            api_send({
                url:"v1/subscribers/"+input.subscriber_id,
                type:"DELETE"
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }


        //=============App CRUD==============
        this.get_app_list=function(input,callback){
            api_send({
                url:'v1/subscribers/'+subscr_id+'/apps',
                type:"GET"
            },function(err,res){
                if(err)throw err;
                callback(res.apps);
            });
        }
        //Task SAIMAANDR-6
        //Написать функцию получить инфо об арендованных номерах
        this.save_app=function(input,callback) {
            if (!input.name || !input.url){
                return throw_err('Invalid arguments list - name & url is required');
            }
            api_send({
                url: 'v1/subscribers/' + subscr_id + '/apps',
                type: "POST",
                data:{
                    name:input.name,
                    description:input.desc,
                    url:input.url
                }
            }, function (err, res) {
                if (err)throw err;
                callback(res.apps);
            });
        }
        //Task SAIMAANDR-6
        //Написать функцию получить инфо об арендованных номерах
        this.update_app=function(input,callback) {
            if(!input.name || !input.url || !input.app_id){
                return throw_err('Invalid arguments list - name,url,app_id is required');
            }
            api_send({
                url: 'v1/subscribers/' + subscr_id + '/apps/'+input.app_id,
                type: "PUT",
                data:{
                    name:input.name,
                    description:input.desc,
                    url:input.url
                }
            }, function (err, res) {
                if (err)throw err;
                callback(res);
            });
        }
        this.delete_app=function(input,callback) {
            if(!input.app_id){
                return throw_err('Invalid arguments list - app_id is required');
            }
            api_send({
                url: 'v1/subscribers/' + subscr_id + '/apps/'+input.app_id,
                type: "DELETE"
            }, function (err, res) {
                if (err)throw err;
                callback(res);
            });
        }


        //=============Numbers ==============
        this.get_sip_numbers=function(input,callback){
            app.get_numbers({
                type:"SIP",
                location:"INT-NET",
                offset:input.offset||0,
                limit:input.limit||1
            },function(res){
                callback(res);
            });
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
                if(err)throw err;
                callback(res.numbers);
            });
        }

        this.rent_number=function(input,callback){
            if(!input.number){//todo: check number better
                return throw_err('Invalid number');
            }
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
                data:{
                    number:input.number,
                    note:input.note||"Web SDK number",
                    type:"SIP"
                }
            },function(err,res){
                if(err)throw err;
                callback(res);
            });
        }
        this.release_number=function(input,callback){
            if(!input.number){//todo: check number better
                return throw_err('Invalid number');
            }
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
                type:"DELETE"
            },function(err,res){
                console.log(err,res);
                callback(err,res);
            });
        }
        this.update_number=function(input,callback){
            if(!input.number){//todo: check number better
                return throw_err('Invalid number');
            }
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
                type:"PUT",
                data:{
                    login:input.login,
                    password:input.password,
                    note:input.note
                }
            },function(err,res){
                console.log(err,res);
                callback(err,res);
            });
        }


        this.get_numbers_by_app=function(input,callback){
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers",
                type:"GET"
            },function(err,res){
                if(err)throw err;
                callback(res.numbers);
            });
        }

        //Task SAIMAANDR-7
        //Написать функцию Получить информацию об арендованном номере
        this.get_app_number=function(input,callback){
            if(!input.number)return throw_err('Invalid number '+input.number);
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number,
                type:"GET"
            },function(err,res){
                console.log(res,err);
                callback(res,err);
            });
        }

        //=============Call forwardings CRUD==============
        this.get_number_callforwardings=function(input,callback){
            if(!input.number)return throw_err('Invalid number '+input.number);
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
                type:"GET"
            },function(err,res){
                if(err)throw err;
                callback(res);
            });
        }
        this.set_number_callforwardings=function(input,callback){
            if(!input.number)return throw_err('Invalid number '+input.number);
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
            },function(err,res){
                if(err)throw err;
                callback(res);
            });
        }
        this.update_number_callforwardings=function(input,callback){
            return;
            if(!input.number)return throw_err('Invalid number '+input.number);
            //todo: validation
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
                type:"POST",
                data:input
            },function(err,res){
                if(err)throw err;
                callback(res);
            });
        }
        this.delete_number_callforwardings=function(input,callback){
            return;
            if(!input.number)return throw_err('Invalid number '+input.number);
            api_send({
                url:"v1/apps/"+(input.app_id||app.use_app)+"/numbers/"+input.number+"/callforwardings",
                type:"DELETE"
            },function(err,res){
                if(err)throw err;
                callback(res);
            });
        }

    }
}