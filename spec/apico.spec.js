var should = require('should');
var apico=require('apico');

describe('Apico', function() {
    it('should be function', function () {
        apico.should.be.function;
    });
    it('should fail', function (done) {
        Apico=new apico("APICOSDK@APINET","4uu1ns7utsu");
        done();
    });
    it('should logged', function (done) {
        Apico=new apico("APICOSDK@APICO.NET","4uu1ns7utsu2");
        done();
    });
	
	describe('get_app_list',function(){
		it('should return array',function(done){
			Apico.get_app_list({},function(err,res){
				res.should.be.Array();
				done(err);
			})
		})
	})

});